-- Run after profiles_schema.sql.
-- Adds phone-number login: profiles.phone stores the real number a user
-- typed in; auth.users still holds a synthetic "<phone>@phone.advat.local"
-- email under the hood since Supabase's password auth needs an email-shaped
-- identifier. The app (lib/phone.js + AuthProvider) builds that synthetic
-- address — this migration only needs to store + protect the real number.

alter table public.profiles
  add column if not exists phone text unique;

-- Same signup trigger as profiles_schema.sql, extended to also copy the
-- phone number out of auth metadata (set at signup time) into the new
-- column. Safe to re-run — replaces the existing trigger function.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;
