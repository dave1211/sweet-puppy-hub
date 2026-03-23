DROP POLICY IF EXISTS "No direct writes to rewards" ON public.rewards;
DROP POLICY IF EXISTS "No direct writes to points_log" ON public.points_log;
DROP POLICY IF EXISTS "No direct writes to user_roles" ON public.user_roles;

CREATE POLICY "Deny rewards insert"
ON public.rewards
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Deny rewards update"
ON public.rewards
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny rewards delete"
ON public.rewards
FOR DELETE
TO authenticated, anon
USING (false);

CREATE POLICY "Deny points_log insert"
ON public.points_log
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Deny points_log update"
ON public.points_log
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny points_log delete"
ON public.points_log
FOR DELETE
TO authenticated, anon
USING (false);

CREATE POLICY "Deny user_roles insert"
ON public.user_roles
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Deny user_roles update"
ON public.user_roles
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny user_roles delete"
ON public.user_roles
FOR DELETE
TO authenticated, anon
USING (false);