-- Run this once in Supabase Dashboard → SQL Editor
-- Direct messages between two users.

create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  read boolean not null default false,
  created_at timestamptz default now(),
  constraint dm_messages_no_self_message check (sender_id <> recipient_id)
);

create index if not exists dm_messages_sender_idx on public.dm_messages(sender_id);
create index if not exists dm_messages_recipient_idx on public.dm_messages(recipient_id);
create index if not exists dm_messages_thread_idx
  on public.dm_messages(least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at);

alter table public.dm_messages enable row level security;

-- Only the two people in a conversation can see it
create policy "Users can view their own conversations"
  on public.dm_messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- Users can only send messages as themselves
create policy "Users can send messages as themselves"
  on public.dm_messages for insert
  with check (auth.uid() = sender_id);

-- Recipients can mark messages read (and only that field, enforced app-side)
create policy "Recipients can mark messages as read"
  on public.dm_messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- Needed so both sender and recipient get realtime INSERT events
alter table public.dm_messages replica identity full;
alter publication supabase_realtime add table public.dm_messages;
