-- Run after business_profile_fields_migration.sql.
-- Adds a general business contact phone number (business_phone), separate
-- from whatsapp — whatsapp drives the wa.me deep link on the public profile,
-- business_phone is a plain "call us" number and isn't guaranteed to be a
-- WhatsApp-enabled line. Both are stored normalized (digits only, country
-- code prefixed, e.g. "255712345678") by lib/phone.js's normalizePhone
-- before they ever reach this column — the app accepts "0712345678" or
-- "+255712345678" typed in and converts either to that form.

alter table public.profiles
  add column if not exists business_phone text;

alter table public.profiles
  add constraint profiles_business_phone_format
    check (business_phone is null or business_phone ~ '^\d{9,15}$');

grant select (business_phone) on public.profiles to anon, authenticated;
