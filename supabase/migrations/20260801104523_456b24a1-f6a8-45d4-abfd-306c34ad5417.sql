GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.searches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_ledger TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.leads, public.searches, public.agent_events, public.projects, public.exports, public.credit_ledger, public.profiles, public.user_roles TO service_role;