-- Allow users to read invite codes allocated to them
CREATE POLICY "Users can read own allocated invite codes"
ON public.invite_codes
FOR SELECT
TO authenticated
USING (allocated_to = auth.uid());

-- Allow users to look up active invite codes for redemption
CREATE POLICY "Users can read active invite codes for redemption"
ON public.invite_codes
FOR SELECT
TO authenticated
USING (active = true AND current_uses < max_uses);