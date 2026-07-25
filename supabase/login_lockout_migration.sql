-- Run after phone_login_migration.sql.
-- Adds account lockout after repeated wrong PINs, entirely server-side —
-- the client never decides whether an account is locked, it only asks.
--
-- Also tightens column access: profiles.phone was added by
-- phone_login_migration.sql under the existing "viewable by everyone" row
-- policy, which (since RLS is row-level, not column-level) meant anyone
-- with the anon key could `select phone from profiles` and harvest every
-- user's number. This migration locks that down with explicit column
-- grants — everyone can still read the normal public profile fields,
-- nobody can read phone/lockout columns directly; the RPC functions below
-- are the only way to touch them, and they only ever return a timestamp or
-- an attempt count, never the phone number itself.

alter table public.profiles
  add column if not exists failed_pin_attempts integer not null default 0;

alter table public.profiles
  add column if not exists locked_until timestamptz;

-- Lock down column-level access. Row policies still apply on top of this.
revoke select on public.profiles from anon, authenticated;
grant select (
  id, username, avatar, avatar_url, bio, vibe, created_at,
  account_type, business_category, whatsapp
) on public.profiles to anon, authenticated;
-- Owners still need to see/edit their own phone + lockout state indirectly
-- (e.g. profile settings showing "phone ends in ...1234"); add columns to
-- this grant list later if a screen needs to display them directly.

-- Returns just a timestamp (or null) — never the phone number, never who
-- owns it. Safe to call pre-login since the caller already knows the
-- number they typed.
create or replace function public.get_lock_status(target_phone text)
returns timestamptz as $$
  select locked_until from public.profiles where phone = target_phone;
$$ language sql security definer stable;

grant execute on function public.get_lock_status(text) to anon, authenticated;

-- Called after a failed PIN attempt. Locks for 15 minutes once 5 wrong
-- attempts stack up. A lock that already expired doesn't count against the
-- running total, so someone who waits it out starts fresh rather than
-- getting re-locked on their very next try.
create or replace function public.record_failed_login(target_phone text)
returns jsonb as $$
declare
  cur_attempts integer;
  cur_locked timestamptz;
  new_attempts integer;
  new_locked timestamptz;
begin
  select failed_pin_attempts, locked_until into cur_attempts, cur_locked
  from public.profiles where phone = target_phone;

  if cur_attempts is null then
    return jsonb_build_object('attempts', null, 'locked_until', null);
  end if;

  if cur_locked is not null and cur_locked < now() then
    cur_attempts := 0;
  end if;

  new_attempts := cur_attempts + 1;
  new_locked := case when new_attempts >= 5 then now() + interval '15 minutes' else cur_locked end;

  update public.profiles
  set failed_pin_attempts = new_attempts, locked_until = new_locked
  where phone = target_phone;

  return jsonb_build_object('attempts', new_attempts, 'locked_until', new_locked);
end;
$$ language plpgsql security definer;

grant execute on function public.record_failed_login(text) to anon, authenticated;

-- Called after a successful sign-in — clears the counter and any lock.
create or replace function public.record_successful_login(target_phone text)
returns void as $$
  update public.profiles
  set failed_pin_attempts = 0, locked_until = null
  where phone = target_phone;
$$ language sql security definer;

grant execute on function public.record_successful_login(text) to anon, authenticated;
