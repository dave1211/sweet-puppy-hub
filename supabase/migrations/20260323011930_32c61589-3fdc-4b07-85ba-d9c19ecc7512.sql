CREATE POLICY "No direct access to wallet auth credentials"
ON public.wallet_auth_credentials
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);