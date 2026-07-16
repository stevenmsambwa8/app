-- Run after dm_messages_schema.sql — adds image/voice-note support and
-- lets senders delete (unsend) their own messages.

alter table public.dm_messages
  alter column text drop not null;

alter table public.dm_messages
  add column if not exists image_url text,
  add column if not exists audio_url text,
  add column if not exists audio_duration integer;

-- A message must have at least one kind of content
alter table public.dm_messages
  drop constraint if exists dm_messages_has_content;
alter table public.dm_messages
  add constraint dm_messages_has_content
  check (coalesce(text, '') <> '' or image_url is not null or audio_url is not null);

-- Senders can unsend their own messages
drop policy if exists "Senders can delete their own messages" on public.dm_messages;
create policy "Senders can delete their own messages"
  on public.dm_messages for delete
  using (auth.uid() = sender_id);
