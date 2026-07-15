-- Run this once in Supabase Dashboard → SQL Editor

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  avatar text default '🐧',
  avatar_url text,
  bio text default 'Daima ninafuatilia mwanga mzuri na urafiki bora.',
  vibe text default 'Mwanachama Mpya',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Anyone can view profiles (needed for feed/people pages)
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Lets the app create a user's own profile row if the signup trigger
-- hasn't run yet (self-heal on first login)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
