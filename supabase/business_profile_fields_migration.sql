-- Run after business_features_migration.sql and login_lockout_migration.sql.
-- Adds richer business-profile fields (name, description, contact info) plus
-- a "custom mention" — a @username a business can point to as its contact
-- person, rendered the same way @mentions render elsewhere in the app
-- (see lib/richText.js) and linking to /u/<username>.

alter table public.profiles
  add column if not exists business_name text;

alter table public.profiles
  add column if not exists business_description text;

alter table public.profiles
  add column if not exists business_email text;

alter table public.profiles
  add column if not exists business_address text;

alter table public.profiles
  add column if not exists business_website text;

alter table public.profiles
  add column if not exists business_hours text;

-- The "custom mention" — free-text username (not a foreign key, since
-- usernames can change and we don't want a business's contact field to
-- break silently if that user renames). The app validates it against
-- public.profiles at save time and re-checks on render before linking it.
alter table public.profiles
  add column if not exists mention_username text;

alter table public.profiles
  add constraint profiles_business_name_length check (char_length(business_name) <= 60);
alter table public.profiles
  add constraint profiles_business_description_length check (char_length(business_description) <= 300);
alter table public.profiles
  add constraint profiles_mention_username_format
    check (mention_username is null or mention_username ~ '^[a-zA-Z0-9_]{2,30}$');

-- login_lockout_migration.sql switched profiles to explicit column-level
-- grants (row policies alone no longer gate which *columns* are readable).
-- Every new column exposed to the client has to be added to that grant
-- list here, or selecting it will fail with "permission denied for table
-- profiles" even though the row is visible.
grant select (
  business_name, business_description, business_email,
  business_address, business_website, business_hours, mention_username
) on public.profiles to anon, authenticated;
