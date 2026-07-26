-- Run after business_features_migration.sql.
-- Lets a business post carry a price and become an "add to cart" item.
-- The cart itself lives client-side (localStorage) and checkout happens
-- via a WhatsApp message to the business — no payment processing here yet.
-- cart_adds is the one thing worth tracking server-side: how many times
-- anyone, anywhere, tapped "add to cart" on this post, so a business can
-- see real interest in their Takwimu (analytics) tab even without a full
-- order backend.

alter table public.posts
  add column if not exists price numeric;

alter table public.posts
  add column if not exists cart_adds integer not null default 0;

-- Same pattern as increment_cta_click: safe to expose past the normal
-- "only the owner can update" policy on public.posts because it can only
-- ever bump this one counter, nothing else.
create or replace function public.increment_cart_add(target_post_id uuid)
returns void as $$
  update public.posts set cart_adds = cart_adds + 1 where id = target_post_id;
$$ language sql security definer;

grant execute on function public.increment_cart_add(uuid) to anon, authenticated;
