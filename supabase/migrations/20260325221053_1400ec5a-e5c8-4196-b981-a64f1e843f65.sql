-- Harden usage_events inserts: require explicit authenticated ownership and non-null user_id
DROP POLICY IF EXISTS "Users can insert own usage events" ON public.usage_events;
CREATE POLICY "Users can insert own usage events"
ON public.usage_events
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IS NOT NULL
  AND user_id = auth.uid()
  AND (
    session_id IS NULL
    OR (length(session_id) >= 1 AND length(session_id) <= 128)
  )
);

-- Prevent inviter visibility into referred users' UUIDs once invite is consumed
DROP POLICY IF EXISTS "Users can read own referral invites" ON public.referral_invites;
CREATE POLICY "Users can read own pending referral invites"
ON public.referral_invites
FOR SELECT
TO authenticated
USING (
  inviter_id = auth.uid()
  AND used_by IS NULL
);

-- Remove recipient-level read policy that exposed internal invite metadata columns
DROP POLICY IF EXISTS "Users read own invite codes" ON public.invite_codes;