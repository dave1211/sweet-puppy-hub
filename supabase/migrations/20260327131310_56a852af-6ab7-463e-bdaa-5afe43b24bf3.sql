CREATE TABLE public.wallet_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  address TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'solana',
  label TEXT,
  role TEXT NOT NULL DEFAULT 'unknown',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_watch_only BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, address, chain)
);

ALTER TABLE public.wallet_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wallet profiles"
  ON public.wallet_profiles FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own wallet profiles"
  ON public.wallet_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);