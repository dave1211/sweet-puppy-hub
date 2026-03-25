-- Fix 2: Tighten usage_events insert
DROP POLICY IF EXISTS "Users can insert own usage events" ON public.usage_events;
CREATE POLICY "Users can insert own usage events"
  ON public.usage_events FOR INSERT TO authenticated
  WITH CHECK (user_id::uuid = auth.uid());

-- Fix 3: Restrict usage_events reads
DROP POLICY IF EXISTS "Users can read own usage events" ON public.usage_events;
CREATE POLICY "Users can read own usage events"
  ON public.usage_events FOR SELECT TO authenticated
  USING (user_id::uuid = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Phase 9: referral_invites table for viral loop
CREATE TABLE IF NOT EXISTS public.referral_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid NOT NULL,
  invite_code text NOT NULL UNIQUE,
  used_by uuid DEFAULT NULL,
  used_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  tier text DEFAULT 'free'
);

ALTER TABLE public.referral_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own referral invites"
  ON public.referral_invites FOR SELECT TO authenticated
  USING (inviter_id = auth.uid());

CREATE POLICY "Users can create own referral invites"
  ON public.referral_invites FOR INSERT TO authenticated
  WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Users can update own referral invites"
  ON public.referral_invites FOR UPDATE TO authenticated
  USING (inviter_id = auth.uid());

-- Phase 9: growth_metrics table
CREATE TABLE IF NOT EXISTS public.growth_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  signups integer DEFAULT 0,
  active_users integer DEFAULT 0,
  wallet_connects integer DEFAULT 0,
  upgrades integer DEFAULT 0,
  revenue_usd numeric DEFAULT 0,
  referral_signups integer DEFAULT 0,
  churn integer DEFAULT 0,
  dau_over_mau numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.growth_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read growth metrics"
  ON public.growth_metrics FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert growth metrics"
  ON public.growth_metrics FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.growth_metrics;