
-- 1. Anomaly events table for security monitoring
CREATE TABLE IF NOT EXISTS public.anomaly_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  actor_id uuid,
  actor_type text DEFAULT 'user',
  target_id text,
  target_type text,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open',
  resolution_notes text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.anomaly_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read anomalies" ON public.anomaly_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update anomalies" ON public.anomaly_events
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Invite codes for private alpha gating
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  created_by uuid,
  used_by uuid,
  used_at timestamptz,
  max_uses integer NOT NULL DEFAULT 1,
  current_uses integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invite codes" ON public.invite_codes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Seed default feature flags + kill switches
INSERT INTO public.feature_flags (key, description, enabled, min_tier, metadata) VALUES
  ('launch_enabled', 'Token launch creation', true, 'free', '{"kill_switch": true}'::jsonb),
  ('sniper_enabled', 'Sniper opportunity feed', true, 'free', '{"kill_switch": true}'::jsonb),
  ('alerts_enabled', 'Alert creation and dispatch', true, 'free', '{"kill_switch": true}'::jsonb),
  ('referrals_enabled', 'Referral system', true, 'free', '{"kill_switch": false}'::jsonb),
  ('affiliates_enabled', 'Affiliate system', false, 'free', '{"kill_switch": false}'::jsonb),
  ('user_chat_enabled', 'AI chat widget for users', true, 'free', '{"kill_switch": true}'::jsonb),
  ('owner_adviser_enabled', 'Owner super adviser', true, 'owner', '{"kill_switch": false}'::jsonb),
  ('premium_upgrade_enabled', 'Premium upgrade flow', true, 'free', '{"kill_switch": true}'::jsonb),
  ('signal_ingestion_enabled', 'Signal ingestion pipeline', true, 'free', '{"kill_switch": true}'::jsonb),
  ('public_signup_enabled', 'Public signups (disable for private alpha)', false, 'free', '{"kill_switch": true}'::jsonb),
  ('private_alpha_mode', 'Require invite code for access', true, 'free', '{"kill_switch": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. Add handle_new_user trigger (it exists as function but trigger may be missing)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Index for anomaly queries
CREATE INDEX IF NOT EXISTS idx_anomaly_events_type_status ON public.anomaly_events (event_type, status);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_created ON public.anomaly_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs (actor_id);
