-- Secure rewards initialization via server-controlled RPC and remove direct client inserts
DROP POLICY IF EXISTS "Auth user can insert own rewards" ON public.rewards;

CREATE OR REPLACE FUNCTION public.initialize_rewards(
  p_device_id text,
  p_referral_code text,
  p_referred_by text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing public.rewards%ROWTYPE;
  v_referrer_user_id uuid;
  v_points integer := 0;
  v_referral_code text := lower(trim(p_referral_code));
  v_referred_by text := nullif(lower(trim(coalesce(p_referred_by, ''))), '');
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_device_id IS NULL OR length(trim(p_device_id)) = 0 OR length(trim(p_device_id)) > 128 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid device identifier');
  END IF;

  IF v_referral_code IS NULL OR length(v_referral_code) < 4 OR length(v_referral_code) > 64 OR v_referral_code !~ '^[a-z0-9_-]+$' THEN
    RETURN json_build_object('success', false, 'error', 'Invalid referral code format');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text));

  SELECT * INTO v_existing
  FROM public.rewards
  WHERE user_id = v_user_id
  LIMIT 1;

  IF FOUND THEN
    RETURN json_build_object('success', true, 'record', row_to_json(v_existing));
  END IF;

  IF v_referred_by IS NOT NULL THEN
    IF v_referred_by = v_referral_code THEN
      v_referred_by := NULL;
    ELSE
      SELECT user_id INTO v_referrer_user_id
      FROM public.rewards
      WHERE referral_code = v_referred_by
      LIMIT 1;

      IF v_referrer_user_id IS NOT NULL AND v_referrer_user_id <> v_user_id THEN
        v_points := 50;
      ELSE
        v_referred_by := NULL;
      END IF;
    END IF;
  END IF;

  INSERT INTO public.rewards (user_id, device_id, referral_code, referred_by, points, total_referrals)
  VALUES (v_user_id, trim(p_device_id), v_referral_code, v_referred_by, v_points, 0)
  RETURNING * INTO v_existing;

  IF v_referred_by IS NOT NULL THEN
    UPDATE public.rewards
    SET total_referrals = total_referrals + 1,
        updated_at = now()
    WHERE referral_code = v_referred_by;
  END IF;

  RETURN json_build_object('success', true, 'record', row_to_json(v_existing));
EXCEPTION
  WHEN unique_violation THEN
    SELECT * INTO v_existing
    FROM public.rewards
    WHERE user_id = v_user_id
    LIMIT 1;

    RETURN json_build_object('success', true, 'record', row_to_json(v_existing));
END;
$$;

-- Store wallet auth credentials server-side to avoid deterministic password derivation from service keys
CREATE TABLE IF NOT EXISTS public.wallet_auth_credentials (
  wallet_address text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_auth_credentials ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.wallet_auth_credentials FROM anon;
REVOKE ALL ON TABLE public.wallet_auth_credentials FROM authenticated;

DROP TRIGGER IF EXISTS update_wallet_auth_credentials_updated_at ON public.wallet_auth_credentials;
CREATE TRIGGER update_wallet_auth_credentials_updated_at
BEFORE UPDATE ON public.wallet_auth_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();