REVOKE INSERT, UPDATE, DELETE ON public.items FROM anon, PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, PUBLIC;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.messages FROM anon, PUBLIC;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.user_roles FROM anon, PUBLIC;

GRANT SELECT ON public.items TO anon;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.items TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.messages TO service_role;
GRANT ALL ON public.user_roles TO service_role;