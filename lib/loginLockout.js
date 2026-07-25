// Purely a UX accelerant: remembers "this phone number is locked until X"
// locally so re-opening the login form (or retyping the same number) shows
// the lock instantly instead of waiting on a round trip. It is NOT the
// security boundary — that's enforced server-side by the RPCs in
// supabase/login_lockout_migration.sql, which run on every real sign-in
// attempt regardless of what's cached here. Clearing localStorage doesn't
// unlock anything; it just means the next attempt has to ask the server.
const PREFIX = 'advat:loginLock:';

export function getCachedLock(phoneDigits) {
  if (typeof window === 'undefined' || !phoneDigits) return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + phoneDigits);
    if (!raw) return null;
    const until = new Date(raw);
    if (Number.isNaN(until.getTime()) || until <= new Date()) {
      window.localStorage.removeItem(PREFIX + phoneDigits);
      return null;
    }
    return until;
  } catch {
    return null;
  }
}

export function setCachedLock(phoneDigits, lockedUntilIso) {
  if (typeof window === 'undefined' || !phoneDigits) return;
  try {
    if (lockedUntilIso) {
      window.localStorage.setItem(PREFIX + phoneDigits, lockedUntilIso);
    } else {
      window.localStorage.removeItem(PREFIX + phoneDigits);
    }
  } catch {
    // best-effort only
  }
}
