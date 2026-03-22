-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Watchlist table
CREATE TABLE public.watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  address TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(device_id, address)
);
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read watchlist by device_id" ON public.watchlist FOR SELECT USING (true);
CREATE POLICY "Anyone can insert watchlist" ON public.watchlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update watchlist" ON public.watchlist FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete watchlist" ON public.watchlist FOR DELETE USING (true);
CREATE TRIGGER update_watchlist_updated_at BEFORE UPDATE ON public.watchlist FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  address TEXT NOT NULL,
  kind TEXT NOT NULL,
  direction TEXT NOT NULL,
  threshold NUMERIC NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read alerts" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert alerts" ON public.alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update alerts" ON public.alerts FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete alerts" ON public.alerts FOR DELETE USING (true);
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tracked wallets table
CREATE TABLE public.tracked_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  address TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(device_id, address)
);
ALTER TABLE public.tracked_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tracked_wallets" ON public.tracked_wallets FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tracked_wallets" ON public.tracked_wallets FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tracked_wallets" ON public.tracked_wallets FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete tracked_wallets" ON public.tracked_wallets FOR DELETE USING (true);
CREATE TRIGGER update_tracked_wallets_updated_at BEFORE UPDATE ON public.tracked_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();