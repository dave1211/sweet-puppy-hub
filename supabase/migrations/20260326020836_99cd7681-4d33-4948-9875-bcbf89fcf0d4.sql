-- Restrict feature_flags to authenticated users only (remove public read)
DROP POLICY IF EXISTS "Anyone can read feature flags" ON public.feature_flags;

CREATE POLICY "Authenticated users can read feature flags"
ON public.feature_flags
FOR SELECT
TO authenticated
USING (true);

-- Explicitly deny launches UPDATE/DELETE for non-admin users
CREATE POLICY "Deny launches update"
ON public.launches
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny launches delete"
ON public.launches
FOR DELETE
TO authenticated
USING (false);