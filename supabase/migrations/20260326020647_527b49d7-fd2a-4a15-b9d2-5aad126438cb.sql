-- Block anonymous access to growth_metrics
CREATE POLICY "Deny anon growth_metrics read"
ON public.growth_metrics
FOR SELECT
TO anon
USING (false);

-- Block anonymous access to analytics_daily
CREATE POLICY "Deny anon analytics_daily read"
ON public.analytics_daily
FOR SELECT
TO anon
USING (false);