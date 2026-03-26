-- usage_events: deny UPDATE
CREATE POLICY "Deny usage_events update"
ON public.usage_events FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

-- anomaly_events: deny INSERT and DELETE for non-admin
CREATE POLICY "Deny anomaly_events insert"
ON public.anomaly_events FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Deny anomaly_events delete"
ON public.anomaly_events FOR DELETE TO authenticated USING (false);

-- audit_logs: deny UPDATE and DELETE (immutable logs)
CREATE POLICY "Deny audit_logs update"
ON public.audit_logs FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Deny audit_logs delete"
ON public.audit_logs FOR DELETE TO authenticated USING (false);