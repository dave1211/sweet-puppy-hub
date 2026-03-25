
-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free','pro','elite','vip')),
  wallet_address text,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TOKENS
-- ============================================
CREATE TABLE public.tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL UNIQUE,
  symbol text NOT NULL,
  name text NOT NULL,
  chain text NOT NULL DEFAULT 'solana',
  dex_id text,
  image_url text,
  website text,
  twitter text,
  telegram text,
  description text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tokens" ON public.tokens FOR SELECT USING (true);

-- ============================================
-- LAUNCHES
-- ============================================
CREATE TABLE public.launches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES public.tokens(id),
  creator_user_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','completed','failed','cancelled')),
  fee_sol numeric NOT NULL DEFAULT 0,
  fee_paid boolean NOT NULL DEFAULT false,
  featured boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.launches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own launches" ON public.launches FOR SELECT TO authenticated USING (creator_user_id = auth.uid());
CREATE POLICY "Users insert own launches" ON public.launches FOR INSERT TO authenticated WITH CHECK (creator_user_id = auth.uid());
CREATE POLICY "Admins read all launches" ON public.launches FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- SIGNAL EVENTS
-- ============================================
CREATE TABLE public.signal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  source_type text NOT NULL DEFAULT 'system',
  category text NOT NULL,
  token_address text,
  wallet_address text,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','low','medium','high','critical')),
  confidence integer NOT NULL DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
  score integer DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  tags text[] DEFAULT '{}',
  summary text,
  raw_data jsonb DEFAULT '{}',
  processed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.signal_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read signals" ON public.signal_events FOR SELECT TO authenticated USING (true);

-- ============================================
-- RISK SCORES
-- ============================================
CREATE TABLE public.risk_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_address text NOT NULL,
  score integer NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  verdict text NOT NULL DEFAULT 'unknown' CHECK (verdict IN ('safer','caution','risky','high_risk','unknown')),
  factors jsonb NOT NULL DEFAULT '{}',
  liquidity_warning boolean NOT NULL DEFAULT false,
  concentration_warning boolean NOT NULL DEFAULT false,
  suspicious_activity boolean NOT NULL DEFAULT false,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read risk" ON public.risk_scores FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_risk_scores_token ON public.risk_scores(token_address);

-- ============================================
-- SNIPER OPPORTUNITIES
-- ============================================
CREATE TABLE public.sniper_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_address text NOT NULL,
  token_symbol text,
  token_name text,
  sniper_score integer NOT NULL DEFAULT 0 CHECK (sniper_score BETWEEN 0 AND 100),
  confidence integer NOT NULL DEFAULT 50,
  risk_score integer DEFAULT 0,
  momentum_score integer DEFAULT 0,
  smart_money_score integer DEFAULT 0,
  whale_score integer DEFAULT 0,
  freshness_score integer DEFAULT 0,
  liquidity_score integer DEFAULT 0,
  action_label text NOT NULL DEFAULT 'watch' CHECK (action_label IN ('watch','early','hot','caution','avoid')),
  urgency text NOT NULL DEFAULT 'low' CHECK (urgency IN ('low','medium','high','critical')),
  explanation text,
  tags text[] DEFAULT '{}',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sniper_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read sniper opps" ON public.sniper_opportunities FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_sniper_opps_score ON public.sniper_opportunities(sniper_score DESC);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  body text,
  action_url text,
  read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free','pro','elite','vip')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','expired','past_due')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  payment_provider text,
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============================================
-- USAGE EVENTS (analytics + monetisation triggers)
-- ============================================
CREATE TABLE public.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own usage" ON public.usage_events FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own usage" ON public.usage_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_usage_events_type ON public.usage_events(event_type, created_at DESC);

-- ============================================
-- AUDIT LOGS (admin actions)
-- ============================================
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- FEATURE FLAGS
-- ============================================
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  description text,
  min_tier text DEFAULT 'free',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read feature flags" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "Admins manage feature flags" ON public.feature_flags FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ANALYTICS DAILY (owner war room)
-- ============================================
CREATE TABLE public.analytics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  total_users integer DEFAULT 0,
  new_users integer DEFAULT 0,
  active_users integer DEFAULT 0,
  premium_users integer DEFAULT 0,
  revenue_sol numeric DEFAULT 0,
  launches_count integer DEFAULT 0,
  sniper_uses integer DEFAULT 0,
  alerts_created integer DEFAULT 0,
  referral_signups integer DEFAULT 0,
  top_tokens jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read analytics" ON public.analytics_daily FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tokens_updated_at BEFORE UPDATE ON public.tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_launches_updated_at BEFORE UPDATE ON public.launches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_risk_scores_updated_at BEFORE UPDATE ON public.risk_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sniper_opps_updated_at BEFORE UPDATE ON public.sniper_opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
