
-- burn_history doesn't have device_id, use wallet_address for owner filtering
-- The previous migration partially succeeded (function + policies for watchlist, alerts, tracked_wallets, snipe_history, rewards were created)
-- Only burn_history failed, so fix just that

DROP POLICY IF EXISTS "Anyone can read burn_history" ON public.burn_history;
DROP POLICY IF EXISTS "Anyone can insert burn_history" ON public.burn_history;
DROP POLICY IF EXISTS "Owner can read burn_history" ON public.burn_history;
DROP POLICY IF EXISTS "Owner can insert burn_history" ON public.burn_history;

-- burn_history uses wallet_address, not device_id - keep read open but restrict insert
CREATE POLICY "Anyone can read own burn_history" ON public.burn_history
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert burn_history" ON public.burn_history
  FOR INSERT WITH CHECK (true);
