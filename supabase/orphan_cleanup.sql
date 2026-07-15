-- The app itself aggressively cleans up each signed-in user's OWN old
-- avatar files (on every login and every new upload) — that covers the
-- normal case client-side, no service role needed.
--
-- This function covers the case the client can't: files left behind after
-- an account is deleted, where nobody is signed in anymore to trigger a
-- client-side sweep. Run it manually whenever, or schedule it below.

create or replace function public.cleanup_orphaned_avatars()
returns integer
language plpgsql
security definer
as $$
declare
  removed_count integer := 0;
begin
  with orphans as (
    select o.name
    from storage.objects o
    where o.bucket_id = 'avatars'
      and not exists (
        select 1 from public.profiles p
        where p.avatar_url like '%' || o.name
      )
  )
  delete from storage.objects
  where bucket_id = 'avatars'
    and name in (select name from orphans);

  get diagnostics removed_count = row_count;
  return removed_count;
end;
$$;

-- Run any time in the SQL Editor:
-- select public.cleanup_orphaned_avatars();

-- Optional: run it automatically every night at 03:00.
-- Requires the pg_cron extension — enable it first under
-- Dashboard → Database → Extensions → pg_cron, then run:
--
-- select cron.schedule(
--   'cleanup-orphaned-avatars',
--   '0 3 * * *',
--   $$select public.cleanup_orphaned_avatars();$$
-- );
