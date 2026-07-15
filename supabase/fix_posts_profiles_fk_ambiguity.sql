-- The app's "Could not embed because more than one relationship was found
-- for 'posts' and 'profiles'" error means there are two foreign keys
-- between these tables. Run this first to see what's actually there:

select
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.posts'::regclass
  and confrelid = 'public.profiles'::regclass;

-- You should see exactly ONE row, something like:
--   posts_user_id_fkey | FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
--
-- If you see TWO rows, keep the one named "posts_user_id_fkey" (the app
-- code now explicitly requests that one by name, so it'll work either way)
-- and drop the extra one — replace <extra_constraint_name> below:
--
-- alter table public.posts drop constraint <extra_constraint_name>;

-- If your one real constraint is NOT named "posts_user_id_fkey", either
-- rename it to match:
--
-- alter table public.posts rename constraint <your_constraint_name> to posts_user_id_fkey;
--
-- ...or tell Claude the actual name and it'll update the query instead.
