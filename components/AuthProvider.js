'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signInWithPassword: async () => ({ error: null }),
  signUpWithPassword: async () => ({ error: null }),
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
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
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
      .select()
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
      .select()
      .single();

    if (error) return { error };
    setProfile((p) => ({ ...(p || {}), ...data }));
    return { error: null };
  }

  async function uploadAvatar(file) {
    const uid = session?.user?.id;
    if (!uid) return { error: new Error('Umetoka. Ingia kwanza.') };
    if (!file) return { error: new Error('Hakuna picha iliyochaguliwa.') };

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${uid}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, cacheControl: '3600' });
    if (uploadError) return { error: uploadError };

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatar_url = publicUrlData.publicUrl;

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url })
      .eq('id', uid)
      .select()
      .single();
    if (updateError) return { error: updateError };

    setProfile((p) => ({ ...(p || {}), ...data }));
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
        signOut,
        refreshProfile: () => loadProfile(session?.user),
        updateUsername,
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
