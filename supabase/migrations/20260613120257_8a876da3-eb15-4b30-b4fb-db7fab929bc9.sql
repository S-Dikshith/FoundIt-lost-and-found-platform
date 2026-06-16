REVOKE EXECUTE ON FUNCTION public.claim_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO service_role;