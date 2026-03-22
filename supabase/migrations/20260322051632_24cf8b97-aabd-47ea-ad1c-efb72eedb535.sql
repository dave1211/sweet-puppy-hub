CREATE TABLE public.snipe_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  token_address text NOT NULL,
  token_symbol text NOT NULL,
  token_name text NOT NULL,
  entry_price numeric NOT NULL DEFAULT 0,
  entry_time timestamptz NOT NULL DEFAULT now(),
  amount_sol numeric NOT NULL DEFAULT 0.1,
  score integer NOT NULL DEFAULT 0,
  risk integer NOT NULL DEFAULT 0,
  state text NOT NULL DEFAULT 'WATCH',
  exit_price numeric,
  exit_time timestamptz,
  pnl_percent numeric,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.snipe_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read snipe_history" ON public.snipe_history FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert snipe_history" ON public.snipe_history FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update snipe_history" ON public.snipe_history FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete snipe_history" ON public.snipe_history FOR DELETE TO public USING (true);