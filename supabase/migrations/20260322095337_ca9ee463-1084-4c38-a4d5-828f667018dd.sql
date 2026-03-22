CREATE TABLE public.burn_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  token_mint text NOT NULL,
  token_symbol text NOT NULL,
  token_name text NOT NULL,
  amount numeric NOT NULL,
  decimals integer NOT NULL DEFAULT 0,
  signature text NOT NULL,
  account_closed boolean NOT NULL DEFAULT false,
  rent_reclaimed numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.burn_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert burn_history" ON public.burn_history FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read burn_history" ON public.burn_history FOR SELECT TO public USING (true);