-- Deny all INSERT/UPDATE/DELETE on subscriptions for non-admin users
CREATE POLICY "Deny subscriptions insert"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Deny subscriptions update"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny subscriptions delete"
ON public.subscriptions
FOR DELETE
TO authenticated
USING (false);

-- Fix profiles: drop existing UPDATE policy and replace with one that prevents tier modification
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND tier = (SELECT tier FROM public.profiles WHERE id = auth.uid()));

-- Add admin read policy for profiles
CREATE POLICY "Admins read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));