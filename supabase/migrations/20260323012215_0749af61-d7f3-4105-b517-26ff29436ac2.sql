CREATE POLICY "No direct writes to rewards"
ON public.rewards
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "No direct writes to points_log"
ON public.points_log
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "No direct writes to user_roles"
ON public.user_roles
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);