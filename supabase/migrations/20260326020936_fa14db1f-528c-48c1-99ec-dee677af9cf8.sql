-- usage_events: deny DELETE
CREATE POLICY "Deny usage_events delete"
ON public.usage_events FOR DELETE TO authenticated USING (false);

-- notifications: deny INSERT for non-service-role, add DELETE scoped to owner
CREATE POLICY "Deny notifications insert"
ON public.notifications FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Users delete own notifications"
ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- burn_history: deny UPDATE and DELETE
CREATE POLICY "Deny burn_history update"
ON public.burn_history FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Deny burn_history delete"
ON public.burn_history FOR DELETE TO authenticated USING (false);

-- referral_invites: deny UPDATE and DELETE
CREATE POLICY "Deny referral_invites update"
ON public.referral_invites FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Deny referral_invites delete"
ON public.referral_invites FOR DELETE TO authenticated USING (false);

-- signal_events: deny INSERT/UPDATE/DELETE for non-admin
CREATE POLICY "Deny signal_events insert"
ON public.signal_events FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Deny signal_events update"
ON public.signal_events FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Deny signal_events delete"
ON public.signal_events FOR DELETE TO authenticated USING (false);

-- sniper_opportunities: deny INSERT/UPDATE/DELETE
CREATE POLICY "Deny sniper_opportunities insert"
ON public.sniper_opportunities FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Deny sniper_opportunities update"
ON public.sniper_opportunities FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Deny sniper_opportunities delete"
ON public.sniper_opportunities FOR DELETE TO authenticated USING (false);

-- risk_scores: deny INSERT/UPDATE/DELETE
CREATE POLICY "Deny risk_scores insert"
ON public.risk_scores FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Deny risk_scores update"
ON public.risk_scores FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Deny risk_scores delete"
ON public.risk_scores FOR DELETE TO authenticated USING (false);

-- tokens: deny INSERT/UPDATE/DELETE
CREATE POLICY "Deny tokens insert"
ON public.tokens FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Deny tokens update"
ON public.tokens FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Deny tokens delete"
ON public.tokens FOR DELETE TO authenticated USING (false);

-- merch_products: deny INSERT/UPDATE/DELETE
CREATE POLICY "Deny merch_products insert"
ON public.merch_products FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Deny merch_products update"
ON public.merch_products FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Deny merch_products delete"
ON public.merch_products FOR DELETE TO authenticated USING (false);