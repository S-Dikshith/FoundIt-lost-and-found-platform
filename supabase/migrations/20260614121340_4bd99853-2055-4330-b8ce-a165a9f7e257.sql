
-- 1) Column-level access on public.items: anon cannot see contact fields
REVOKE SELECT ON public.items FROM anon;
GRANT SELECT (
  id, user_id, title, description, category, status,
  location, item_date, image_url, created_at, updated_at
) ON public.items TO anon;

-- 2) Column-level access on public.profiles: anon cannot see contact fields
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, display_name, avatar_url, created_at, updated_at
) ON public.profiles TO anon;

-- 3) Drop duplicate storage policies (keep "Item images upload own" / "Item images delete own")
DROP POLICY IF EXISTS "Auth users upload item images" ON storage.objects;
DROP POLICY IF EXISTS "Auth users delete own item images" ON storage.objects;
