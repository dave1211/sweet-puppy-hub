-- Drop the permissive UPDATE policy on rewards
DROP POLICY IF EXISTS "Auth user can update own rewards" ON public.rewards;

-- Create points_log table with claim_date for dedup
CREATE TABLE public.points_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  action text NOT NULL,
  points integer NOT NULL,
  claim_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, action, claim_date)
);

ALTER TABLE public.points_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth user can read own points_log"
  ON public.points_log FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Secure RPC for claiming points
CREATE OR REPLACE FUNCTION public.claim_reward_points(p_action text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points integer;
  v_user_id uuid := auth.uid();
  v_new_total integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  v_points := CASE p_action
    WHEN 'daily_login' THEN 10
    WHEN 'share_signal' THEN 25
    WHEN 'add_watchlist' THEN 5
    WHEN 'set_alert' THEN 5
    WHEN 'connect_wallet' THEN 50
    ELSE 0
  END;

  IF v_points = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid action');
  END IF;

  BEGIN
    INSERT INTO public.points_log (user_id, action, points, claim_date)
    VALUES (v_user_id, p_action, v_points, CURRENT_DATE);
  EXCEPTION WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'Already claimed today');
  END;

  UPDATE public.rewards
  SET points = points + v_points, updated_at = now()
  WHERE user_id = v_user_id;

  SELECT points INTO v_new_total FROM public.rewards WHERE user_id = v_user_id;

  RETURN json_build_object('success', true, 'points_added', v_points, 'new_total', v_new_total);
END;
$$;