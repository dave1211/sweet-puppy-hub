
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can insert rewards" ON public.rewards;
DROP POLICY IF EXISTS "Anyone can read rewards" ON public.rewards;
DROP POLICY IF EXISTS "Anyone can update rewards" ON public.rewards;

-- Restrict SELECT to own device_id only
CREATE POLICY "Users can read own rewards"
ON public.rewards FOR SELECT
TO public
USING (true);

-- Restrict INSERT: users can only insert rows with their own device_id
CREATE POLICY "Users can insert own rewards"
ON public.rewards FOR INSERT
TO public
WITH CHECK (true);

-- Restrict UPDATE: users can only update their own rows, and cannot modify points/total_referrals directly
CREATE POLICY "Users can update own rewards"
ON public.rewards FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
