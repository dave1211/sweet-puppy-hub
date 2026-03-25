
-- Fix 1: Restrict signal_events to admin-only (was readable by all authenticated)
DROP POLICY IF EXISTS "Authenticated read signals" ON public.signal_events;
CREATE POLICY "Admins read signals" ON public.signal_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix 2: Remove dangerous UPDATE policy from referral_invites
DROP POLICY IF EXISTS "Users can update own referral invites" ON public.referral_invites;
