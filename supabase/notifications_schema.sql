-- Run after posts_schema.sql, comments_schema.sql and .sql.
-- Real notifications, auto-populated by triggers whenever someone follows
-- you, likes your post, or comments on your post.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade, -- recipient
  actor_id uuid not null references public.profiles(id) on delete cascade, -- who triggered it
  type text not null check (type in ('follow', 'like', 'comment')),
  post_id uuid references public.posts(id) on delete cascade,
  comment_text text,
  read boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

-- Users only ever see their own notifications
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Users can only mark their own notifications read (no other field should
-- change client-side; enforce that in the app layer)
create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- No insert policy for clients — rows are only ever created by the trigger
-- functions below, which run as security definer and bypass RLS.

create or replace function public.notify_on_follow()
returns trigger as $$
begin
  insert into public.notifications (user_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_follow_notify on public.follows;
create trigger on_follow_notify
  after insert on public.follows
  for each row execute procedure public.notify_on_follow();

create or replace function public.notify_on_like()
returns trigger as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from public.posts where id = new.post_id;
  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id)
    values (owner_id, new.user_id, 'like', new.post_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_like_notify on public.post_likes;
create trigger on_like_notify
  after insert on public.post_likes
  for each row execute procedure public.notify_on_like();

create or replace function public.notify_on_comment()
returns trigger as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from public.posts where id = new.post_id;
  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id, comment_text)
    values (owner_id, new.user_id, 'comment', new.post_id, left(coalesce(new.text, ''), 140));
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_comment_notify on public.comments;
create trigger on_comment_notify
  after insert on public.comments
  for each row execute procedure public.notify_on_comment();

-- Needed for the realtime bell badge / live notification feed
alter table public.notifications replica identity full;
alter publication supabase_realtime add table public.notifications;
