-- Run after posts_schema.sql and profiles_schema.sql.
-- Adds: CTA click tracking on posts, and a business account type +
-- WhatsApp contact + category on profiles.

-- 1. CTA click tracking -------------------------------------------------

alter table public.posts
  add column if not exists cta_clicks integer not null default 0;

-- Anyone (including logged-out visitors) can trigger a CTA click, but only
-- through this function, which bumps just the counter — it can't be used
-- to touch anything else on the post, so it's safe to expose past the
-- normal "only the owner can update" RLS policy on public.posts.
create or replace function public.increment_cta_click(target_post_id uuid)
returns void as $$
  update public.posts set cta_clicks = cta_clicks + 1 where id = target_post_id;
$$ language sql security definer;

grant execute on function public.increment_cta_click(uuid) to anon, authenticated;

-- 2. Business accounts ---------------------------------------------------

alter table public.profiles
  add column if not exists account_type text not null default 'personal'
    check (account_type in ('personal', 'business'));

alter table public.profiles
  add column if not exists business_category text;

alter table public.profiles
  add column if not exists whatsapp text;
