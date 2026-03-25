-- Fix: Allow users to read their own consumed referral invites
CREATE POLICY "Users can read own consumed referral invites"
ON public.referral_invites
FOR SELECT
TO authenticated
USING (used_by = auth.uid());

-- Clean up NULL user_id rows in usage_events, then enforce NOT NULL
DELETE FROM public.usage_events WHERE user_id IS NULL;
ALTER TABLE public.usage_events ALTER COLUMN user_id SET NOT NULL;