
CREATE TABLE public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  referral_code text NOT NULL UNIQUE,
  referred_by text,
  points integer NOT NULL DEFAULT 0,
  total_referrals integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rewards_device_id ON public.rewards(device_id);
CREATE INDEX idx_rewards_referral_code ON public.rewards(referral_code);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rewards" ON public.rewards FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert rewards" ON public.rewards FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update rewards" ON public.rewards FOR UPDATE TO public USING (true);

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.merch_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  category text NOT NULL DEFAULT 'apparel',
  in_stock boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.merch_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read merch" ON public.merch_products FOR SELECT TO public USING (true);

INSERT INTO public.merch_products (name, description, price, image_url, category) VALUES
  ('Tanner Terminal Tee', 'Classic black tee with neon green terminal logo', 29.99, null, 'apparel'),
  ('Alpha Hunter Hoodie', 'Premium hoodie with embroidered sniper crosshair', 59.99, null, 'apparel'),
  ('Diamond Hands Cap', 'Snapback cap with diamond hands emblem', 24.99, null, 'accessories'),
  ('Whale Tracker Mug', 'Ceramic mug — "I track whales for a living"', 14.99, null, 'accessories'),
  ('Rug Pull Survivor Sticker Pack', '10 terminal-themed vinyl stickers', 9.99, null, 'accessories'),
  ('SOL Sniper Mousepad', 'XL mousepad with candlestick chart design', 19.99, null, 'accessories');
