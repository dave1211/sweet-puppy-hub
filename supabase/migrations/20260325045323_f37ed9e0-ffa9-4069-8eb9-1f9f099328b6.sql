-- Remove duplicate/old usage_events policies
DROP POLICY IF EXISTS "Users insert own usage" ON public.usage_events;
DROP POLICY IF EXISTS "Users read own usage" ON public.usage_events;