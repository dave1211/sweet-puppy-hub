
-- Add user_id column to all user tables (nullable initially for migration)
ALTER TABLE public.watchlist ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.tracked_wallets ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.snipe_history ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.burn_history ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop all existing device_id-based and old policies
DROP POLICY IF EXISTS "Owner can read watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Owner can insert watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Owner can update watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Owner can delete watchlist" ON public.watchlist;

DROP POLICY IF EXISTS "Owner can read alerts" ON public.alerts;
DROP POLICY IF EXISTS "Owner can insert alerts" ON public.alerts;
DROP POLICY IF EXISTS "Owner can update alerts" ON public.alerts;
DROP POLICY IF EXISTS "Owner can delete alerts" ON public.alerts;

DROP POLICY IF EXISTS "Owner can read tracked_wallets" ON public.tracked_wallets;
DROP POLICY IF EXISTS "Owner can insert tracked_wallets" ON public.tracked_wallets;
DROP POLICY IF EXISTS "Owner can update tracked_wallets" ON public.tracked_wallets;
DROP POLICY IF EXISTS "Owner can delete tracked_wallets" ON public.tracked_wallets;

DROP POLICY IF EXISTS "Owner can read snipe_history" ON public.snipe_history;
DROP POLICY IF EXISTS "Owner can insert snipe_history" ON public.snipe_history;
DROP POLICY IF EXISTS "Owner can update snipe_history" ON public.snipe_history;
DROP POLICY IF EXISTS "Owner can delete snipe_history" ON public.snipe_history;

DROP POLICY IF EXISTS "Owner can read rewards" ON public.rewards;
DROP POLICY IF EXISTS "Owner can insert rewards" ON public.rewards;
DROP POLICY IF EXISTS "Owner can update rewards" ON public.rewards;

DROP POLICY IF EXISTS "Anyone can read own burn_history" ON public.burn_history;
DROP POLICY IF EXISTS "Anyone can insert burn_history" ON public.burn_history;

-- Create auth-based RLS policies for watchlist
CREATE POLICY "Auth user can read own watchlist" ON public.watchlist FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Auth user can insert own watchlist" ON public.watchlist FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Auth user can update own watchlist" ON public.watchlist FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Auth user can delete own watchlist" ON public.watchlist FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create auth-based RLS policies for alerts
CREATE POLICY "Auth user can read own alerts" ON public.alerts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Auth user can insert own alerts" ON public.alerts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Auth user can update own alerts" ON public.alerts FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Auth user can delete own alerts" ON public.alerts FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create auth-based RLS policies for tracked_wallets
CREATE POLICY "Auth user can read own tracked_wallets" ON public.tracked_wallets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Auth user can insert own tracked_wallets" ON public.tracked_wallets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Auth user can update own tracked_wallets" ON public.tracked_wallets FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Auth user can delete own tracked_wallets" ON public.tracked_wallets FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create auth-based RLS policies for snipe_history
CREATE POLICY "Auth user can read own snipe_history" ON public.snipe_history FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Auth user can insert own snipe_history" ON public.snipe_history FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Auth user can update own snipe_history" ON public.snipe_history FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Auth user can delete own snipe_history" ON public.snipe_history FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create auth-based RLS policies for rewards
CREATE POLICY "Auth user can read own rewards" ON public.rewards FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Auth user can insert own rewards" ON public.rewards FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Auth user can update own rewards" ON public.rewards FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Create auth-based RLS policies for burn_history
CREATE POLICY "Auth user can read own burn_history" ON public.burn_history FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Auth user can insert own burn_history" ON public.burn_history FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
