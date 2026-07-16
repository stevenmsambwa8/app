-- Run after comments_replies_migration.sql — adds voice note support to comments.

-- A voice-note comment has no text, so it can no longer be required.
alter table public.comments
  alter column text drop not null;

alter table public.comments
  add column if not exists audio_url text,
  add column if not exists audio_duration integer;
