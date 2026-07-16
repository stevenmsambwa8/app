-- Run this once in Supabase Dashboard → SQL Editor
-- Follow / following / followers support.

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  constraint follows_pkey primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create index if not exists follows_following_id_idx on public.follows(following_id);
create index if not exists follows_follower_id_idx on public.follows(follower_id);

alter table public.follows enable row level security;

-- Anyone can see who follows whom (needed for follower/following counts + lists)
create policy "Follows are viewable by everyone"
  on public.follows for select
  using (true);

-- Users can only create a follow row where they are the follower
create policy "Users can follow as themselves"
  on public.follows for insert
  with check (auth.uid() = follower_id);

-- Users can only remove their own follow rows (unfollow)
create policy "Users can unfollow as themselves"
  on public.follows for delete
  using (auth.uid() = follower_id);
