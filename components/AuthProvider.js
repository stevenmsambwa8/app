'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { compressToWebp } from '../lib/compressImage'
import { normalizePhone, isValidPhone, phoneToSyntheticEmail } from '../lib/phone'

// Every profiles read/write from the client must use this explicit column
// list, never '*' or an unscoped .select(). login_lockout_migration.sql
// revoked table-wide SELECT on profiles and only granted these columns —
// phone, failed_pin_attempts, and locked_until are deliberately excluded
// (see that migration for why). Touching an ungranted column, even via an
// UPDATE's implicit RETURNING *, fails with "permission denied for table
// profiles" — that's what selecting/returning '*' anywhere below caused.
const PROFILE_COLUMNS =
  'id, username, avatar, avatar_url, bio, vibe, created_at, account_type, business_category, whatsapp';

// Removes every file in a user's own avatars/<uid>/ folder except the one
// that matches their current profile.avatar_url. Runs client-side using the
// signed-in user's own storage permissions (folder-scoped RLS), so it only
// ever touches that user's own files — safe to call often.
async function sweepAvatarFolder(uid, currentAvatarUrl) {
  if (!uid) return;
  const { data: files, error } = await supabase.storage.from('avatars').list(uid);
  if (error || !files || files.length === 0) return;

  const currentFileName = currentAvatarUrl ? currentAvatarUrl.split('/').pop() : null;
  const orphaned = files
    .filter((f) => f.name !== currentFileName)
    .map((f) => `${uid}/${f.name}`);

  if (orphaned.length > 0) {
    await supabase.storage.from('avatars').remove(orphaned);
  }
}

const AuthContext = createContext({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signInWithPassword: async () => ({ error: null }),
  signUpWithPassword: async () => ({ error: null }),
  signInWithPhone: async () => ({ error: null }),
  signUpWithPhone: async () => ({ error: null }),
  checkPhoneLock: async () => null,
  signOut: async () => {},
  refreshProfile: async () => {},
  updateUsername: async () => ({ error: null }),
  uploadAvatar: async () => ({ error: null }),
});

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Loads the profiles row for a user, self-healing by creating it on the
  // spot if the signup trigger hasn't run yet (e.g. older accounts).
  const loadProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', authUser.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
      sweepAvatarFolder(authUser.id, data.avatar_url).catch(() => {});
      return;
    }

    // No row yet (missed trigger, or trigger not installed) — create one now.
    const fallbackUsername =
      authUser.user_metadata?.username ||
      authUser.email?.split('@')[0] ||
      `user_${authUser.id.slice(0, 6)}`;

    const { data: created, error: createError } = await supabase
      .from('profiles')
      .upsert({ id: authUser.id, username: fallbackUsername }, { onConflict: 'id' })
      .select(PROFILE_COLUMNS)
      .single();

    if (createError) {
      console.warn('Could not self-heal profile row:', createError.message);
      setProfile(null);
      return;
    }
    setProfile(created);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false); // user_metadata is already available, don't block UI on the profile fetch
      loadProfile(data.session?.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
      loadProfile(newSession?.user);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [loadProfile]);

  async function signInWithPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      setSession(data.session);
      loadProfile(data.session?.user);
    }
    return { data, error };
  }

  async function signUpWithPassword(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: username ? { username } : undefined,
      },
    });
    if (!error && data.session) {
      setSession(data.session);
      loadProfile(data.session.user);
    }
    return { data, error };
  }

  // Phone+password auth: no OTP/SMS step. Under the hood this still talks
  // to Supabase's email/password auth using a synthetic
  // "<phone>@phone.advat.local" address (see lib/phone.js) — the real
  // number lives in profiles.phone. Since nothing verifies the number
  // actually belongs to the person typing it, there's no "forgot password"
  // recovery path here; a uniqueness clash just surfaces as a friendly
  // "namba hii tayari imesajiliwa" error.
  //
  // Lockout after repeated wrong PINs is enforced server-side by the RPCs
  // in supabase/login_lockout_migration.sql — this function always asks
  // the server before and after each attempt, never decides on its own.
  async function checkPhoneLock(phoneInput) {
    const digits = normalizePhone(phoneInput);
    if (!isValidPhone(digits)) return null;
    const { data } = await supabase.rpc('get_lock_status', { target_phone: digits });
    return data || null;
  }

  async function signInWithPhone(phoneInput, password) {
    const digits = normalizePhone(phoneInput);
    if (!isValidPhone(digits)) {
      return { error: new Error('Namba ya simu si sahihi.') };
    }

    const { data: lockedUntil } = await supabase.rpc('get_lock_status', { target_phone: digits });
    if (lockedUntil && new Date(lockedUntil) > new Date()) {
      return { error: new Error('locked'), lockedUntil };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: phoneToSyntheticEmail(digits),
      password,
    });

    if (error) {
      const { data: lockInfo } = await supabase.rpc('record_failed_login', { target_phone: digits });
      return {
        error: new Error('Namba ya simu au PIN si sahihi.'),
        lockedUntil: lockInfo?.locked_until || null,
        attempts: lockInfo?.attempts ?? null,
      };
    }

    await supabase.rpc('record_successful_login', { target_phone: digits });
    setSession(data.session);
    loadProfile(data.session?.user);
    return { data, error: null };
  }

  async function signUpWithPhone(phoneInput, password, username) {
    const digits = normalizePhone(phoneInput);
    if (!isValidPhone(digits)) {
      return { error: new Error('Namba ya simu si sahihi.') };
    }
    const { data, error } = await supabase.auth.signUp({
      email: phoneToSyntheticEmail(digits),
      password,
      options: {
        data: { phone: digits, ...(username ? { username } : {}) },
      },
    });
    if (error) {
      const alreadyExists = /already registered|already exists/i.test(error.message || '');
      return { error: new Error(alreadyExists ? 'Namba hii tayari imesajiliwa.' : error.message) };
    }
    if (data.session) {
      setSession(data.session);
      loadProfile(data.session.user);
    }
    return { data, error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  async function updateUsername(newUsername) {
    const uid = session?.user?.id;
    if (!uid) return { error: new Error('Umetoka. Ingia kwanza.') };
    const trimmed = newUsername.trim();
    if (trimmed.length < 2) return { error: new Error('Jina fupi mno.') };

    const { data, error } = await supabase
      .from('profiles')
      .update({ username: trimmed })
      .eq('id', uid)
      .select(PROFILE_COLUMNS)
      .single();

    if (error) return { error };
    setProfile((p) => ({ ...(p || {}), ...data }));
    return { error: null };
  }

  // Switches the account between personal and business, optionally saving
  // a business category and a WhatsApp contact number in the same call.
  async function updateBusinessInfo({ accountType, businessCategory, whatsapp }) {
    const uid = session?.user?.id;
    if (!uid) return { error: new Error('Umetoka. Ingia kwanza.') };

    const payload = {};
    if (accountType !== undefined) payload.account_type = accountType;
    if (businessCategory !== undefined) payload.business_category = businessCategory;
    if (whatsapp !== undefined) payload.whatsapp = whatsapp;

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', uid)
      .select(PROFILE_COLUMNS)
      .single();

    if (error) return { error };
    setProfile((p) => ({ ...(p || {}), ...data }));
    return { error: null };
  }

  async function uploadAvatar(file) {
    const uid = session?.user?.id;
    if (!uid) return { error: new Error('Umetoka. Ingia kwanza.') };
    if (!file) return { error: new Error('Hakuna picha iliyochaguliwa.') };

    let compressed;
    try {
      compressed = await compressToWebp(file, {
        maxBytes: 10 * 1024,
        startDimension: 200,
        minDimension: 64,
      });
    } catch (compressError) {
      return { error: compressError };
    }

    const path = `${uid}/${Date.now()}.webp`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, compressed, {
        upsert: true,
        cacheControl: '3600',
        contentType: 'image/webp',
      });
    if (uploadError) return { error: uploadError };

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatar_url = publicUrlData.publicUrl;

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url })
      .eq('id', uid)
      .select(PROFILE_COLUMNS)
      .single();
    if (updateError) return { error: updateError };

    setProfile((p) => ({ ...(p || {}), ...data }));

    // Old avatar file(s) for this user are now orphaned — remove them immediately.
    sweepAvatarFolder(uid, avatar_url).catch(() => {});

    return { error: null, avatar_url };
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        profile,
        loading,
        signInWithPassword,
        signUpWithPassword,
        signInWithPhone,
        signUpWithPhone,
        checkPhoneLock,
        signOut,
        refreshProfile: () => loadProfile(session?.user),
        updateUsername,
        updateBusinessInfo,
        uploadAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
