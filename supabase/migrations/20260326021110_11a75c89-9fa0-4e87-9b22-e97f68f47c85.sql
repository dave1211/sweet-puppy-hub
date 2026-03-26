-- analytics_daily: deny all writes for authenticated users
CREATE POLICY "Deny analytics_daily insert"
ON public.analytics_daily FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Deny analytics_daily update"
ON public.analytics_daily FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Deny analytics_daily delete"
ON public.analytics_daily FOR DELETE TO authenticated USING (false);

-- growth_metrics: deny UPDATE and DELETE
CREATE POLICY "Deny growth_metrics update"
ON public.growth_metrics FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Deny growth_metrics delete"
ON public.growth_metrics FOR DELETE TO authenticated USING (false);