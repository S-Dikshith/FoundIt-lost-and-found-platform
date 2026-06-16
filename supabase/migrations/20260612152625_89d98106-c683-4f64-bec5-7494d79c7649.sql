
-- Restrict contact columns on profiles from anon
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, display_name, avatar_url, created_at, updated_at) ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO authenticated;

-- Restrict contact columns on items from anon
REVOKE SELECT ON public.items FROM anon;
GRANT SELECT (id, user_id, title, description, category, status, location, item_date, image_url, created_at, updated_at) ON public.items TO anon;
GRANT SELECT ON public.items TO authenticated;

-- Lock down has_role: only needed by RLS policy evaluation (definer) and trusted roles
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
