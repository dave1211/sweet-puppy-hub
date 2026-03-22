
-- Clean up ALL remaining old permissive policies that still use USING(true)
-- These are leftover from the device_id era

-- watchlist old policies
DROP POLICY IF EXISTS "Anyone can read watchlist by device_id" ON public.watchlist;
DROP POLICY IF EXISTS "Anyone can insert watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Anyone can update watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Anyone can delete watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Owner can read watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Owner can insert watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Owner can update watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Owner can delete watchlist" ON public.watchlist;

-- alerts old policies
DROP POLICY IF EXISTS "Anyone can read alerts" ON public.alerts;
DROP POLICY IF EXISTS "Anyone can insert alerts" ON public.alerts;
DROP POLICY IF EXISTS "Anyone can update alerts" ON public.alerts;
DROP POLICY IF EXISTS "Anyone can delete alerts" ON public.alerts;
DROP POLICY IF EXISTS "Owner can read alerts" ON public.alerts;
DROP POLICY IF EXISTS "Owner can insert alerts" ON public.alerts;
DROP POLICY IF EXISTS "Owner can update alerts" ON public.alerts;
DROP POLICY IF EXISTS "Owner can delete alerts" ON public.alerts;

-- tracked_wallets old policies
DROP POLICY IF EXISTS "Anyone can read tracked_wallets" ON public.tracked_wallets;
DROP POLICY IF EXISTS "Anyone can insert tracked_wallets" ON public.tracked_wallets;
DROP POLICY IF EXISTS "Anyone can update tracked_wallets" ON public.tracked_wallets;
DROP POLICY IF EXISTS "Anyone can delete tracked_wallets" ON public.tracked_wallets;
DROP POLICY IF EXISTS "Owner can read tracked_wallets" ON public.tracked_wallets;
DROP POLICY IF EXISTS "Owner can insert tracked_wallets" ON public.tracked_wallets;
DROP POLICY IF EXISTS "Owner can update tracked_wallets" ON public.tracked_wallets;
DROP POLICY IF EXISTS "Owner can delete tracked_wallets" ON public.tracked_wallets;

-- snipe_history old policies
DROP POLICY IF EXISTS "Anyone can read snipe_history" ON public.snipe_history;
DROP POLICY IF EXISTS "Anyone can insert snipe_history" ON public.snipe_history;
DROP POLICY IF EXISTS "Anyone can update snipe_history" ON public.snipe_history;
DROP POLICY IF EXISTS "Anyone can delete snipe_history" ON public.snipe_history;
DROP POLICY IF EXISTS "Owner can read snipe_history" ON public.snipe_history;
DROP POLICY IF EXISTS "Owner can insert snipe_history" ON public.snipe_history;
DROP POLICY IF EXISTS "Owner can update snipe_history" ON public.snipe_history;
DROP POLICY IF EXISTS "Owner can delete snipe_history" ON public.snipe_history;

-- rewards old policies
DROP POLICY IF EXISTS "Anyone can read rewards" ON public.rewards;
DROP POLICY IF EXISTS "Anyone can insert rewards" ON public.rewards;
DROP POLICY IF EXISTS "Anyone can update rewards" ON public.rewards;
DROP POLICY IF EXISTS "Users can read own rewards" ON public.rewards;
DROP POLICY IF EXISTS "Users can insert own rewards" ON public.rewards;
DROP POLICY IF EXISTS "Users can update own rewards" ON public.rewards;
DROP POLICY IF EXISTS "Owner can read rewards" ON public.rewards;
DROP POLICY IF EXISTS "Owner can insert rewards" ON public.rewards;
DROP POLICY IF EXISTS "Owner can update rewards" ON public.rewards;

-- burn_history old policies
DROP POLICY IF EXISTS "Anyone can read burn_history" ON public.burn_history;
DROP POLICY IF EXISTS "Anyone can insert burn_history" ON public.burn_history;
DROP POLICY IF EXISTS "Anyone can read own burn_history" ON public.burn_history;
DROP POLICY IF EXISTS "Owner can read burn_history" ON public.burn_history;
DROP POLICY IF EXISTS "Owner can insert burn_history" ON public.burn_history;

-- Drop the old requesting_device_id function
DROP FUNCTION IF EXISTS public.requesting_device_id();
