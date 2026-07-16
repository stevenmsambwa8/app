-- Run after storage_post_images.sql

insert into storage.buckets (id, name, public)
values ('voice-notes', 'voice-notes', true)
on conflict (id) do nothing;

create policy "Voice notes are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'voice-notes');

create policy "Users can upload their own voice notes"
  on storage.objects for insert
  with check (
    bucket_id = 'voice-notes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own voice notes"
  on storage.objects for delete
  using (
    bucket_id = 'voice-notes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
