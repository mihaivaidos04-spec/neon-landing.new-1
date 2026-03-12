-- Anti-cheat: rate limits + mission with transaction
-- Run in Supabase SQL Editor or via: supabase db push

-- Rate limit table for wallet/add
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, action)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_user_action ON public.api_rate_limits(user_id, action);

-- Atomic rate limit check for wallet/add (row-level lock)
CREATE OR REPLACE FUNCTION public.rate_limit_check(
  p_user_id TEXT,
  p_action TEXT,
  p_window_ms INTEGER DEFAULT 60000,
  p_max_requests INTEGER DEFAULT 15
)
RETURNS TABLE(allowed BOOLEAN, retry_after_ms INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row RECORD;
  v_window_start TIMESTAMPTZ := now() - (p_window_ms || ' milliseconds')::INTERVAL;
BEGIN
  INSERT INTO public.api_rate_limits (user_id, action, request_count, window_start)
  VALUES (p_user_id, p_action, 0, v_window_start)
  ON CONFLICT (user_id, action) DO NOTHING;

  SELECT * INTO v_row FROM public.api_rate_limits
  WHERE user_id = p_user_id AND action = p_action
  FOR UPDATE;

  IF v_row.window_start IS NULL OR v_row.window_start < v_window_start THEN
    UPDATE public.api_rate_limits SET request_count = 1, window_start = now()
    WHERE user_id = p_user_id AND action = p_action;
    RETURN QUERY SELECT true, 0;
    RETURN;
  END IF;

  IF v_row.request_count >= p_max_requests THEN
    RETURN QUERY SELECT false, GREATEST(0, (EXTRACT(EPOCH FROM (v_row.window_start + (p_window_ms || ' milliseconds')::INTERVAL - now())) * 1000)::INTEGER);
    RETURN;
  END IF;

  UPDATE public.api_rate_limits SET request_count = request_count + 1
  WHERE user_id = p_user_id AND action = p_action;

  RETURN QUERY SELECT true, 0;
END;
$$;

-- Mission increment + wallet reward in single transaction (prevents race conditions)
CREATE OR REPLACE FUNCTION public.mission_increment_with_reward(
  p_user_id TEXT,
  p_connection_duration_ms INTEGER
)
RETURNS TABLE(count INTEGER, completed BOOLEAN, just_completed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_existing RECORD;
  v_new_count INTEGER;
  v_goal INTEGER := 5;
  v_reward INTEGER := 3;
  v_min_duration_ms INTEGER := 15000;
BEGIN
  -- Server-side: only count if connection lasted >= 15 seconds
  IF p_connection_duration_ms < v_min_duration_ms THEN
    SELECT COALESCE(connection_count, 0) INTO v_new_count
    FROM public.user_missions
    WHERE user_id = p_user_id AND mission_date = v_today;
    RETURN QUERY SELECT COALESCE(v_new_count, 0), false, false;
    RETURN;
  END IF;

  SELECT id, connection_count, completed INTO v_existing
  FROM public.user_missions
  WHERE user_id = p_user_id AND mission_date = v_today
  FOR UPDATE;

  IF v_existing.completed THEN
    RETURN QUERY SELECT v_goal, true, false;
    RETURN;
  END IF;

  v_new_count := LEAST(COALESCE(v_existing.connection_count, 0) + 1, v_goal);

  IF v_existing.id IS NOT NULL THEN
    UPDATE public.user_missions
    SET connection_count = v_new_count, completed = (v_new_count >= v_goal), updated_at = now()
    WHERE user_id = p_user_id AND mission_date = v_today;
  ELSE
    INSERT INTO public.user_missions (user_id, mission_date, connection_count, completed, updated_at)
    VALUES (p_user_id, v_today, v_new_count, v_new_count >= v_goal, now());
  END IF;

  IF v_new_count >= v_goal THEN
    PERFORM * FROM public.wallet_add(
      p_user_id, v_reward,
      'mission-' || p_user_id || '-' || v_today::TEXT,
      'daily_mission'
    );
  END IF;

  RETURN QUERY SELECT
    v_new_count,
    v_new_count >= v_goal,
    v_new_count >= v_goal AND COALESCE(v_existing.connection_count, 0) < v_goal;
END;
$$;
