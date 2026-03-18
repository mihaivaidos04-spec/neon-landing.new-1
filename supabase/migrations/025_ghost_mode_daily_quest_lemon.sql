-- Ghost Mode: blur profile in leaderboard unless user has paid
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_ghost_mode_enabled BOOLEAN NOT NULL DEFAULT false;

-- Lemon Squeezy payment log (for admin + idempotency)
CREATE TABLE IF NOT EXISTS public.lemon_payment_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lemon_order_id TEXT UNIQUE,
  lemon_order_number BIGINT,
  user_email TEXT NOT NULL,
  user_id TEXT,
  variant_id TEXT,
  product_id TEXT,
  amount_cents INTEGER,
  coins_added INTEGER,
  status TEXT,
  raw_meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lemon_payment_log_order_id ON public.lemon_payment_log(lemon_order_id);
CREATE INDEX IF NOT EXISTS idx_lemon_payment_log_created ON public.lemon_payment_log(created_at DESC);

-- Daily Quest: flexible task types (connections, messages, etc.)
CREATE TABLE IF NOT EXISTS public.daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  quest_date DATE NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('connections', 'messages')),
  target_value INTEGER NOT NULL DEFAULT 5,
  current_value INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  reward_coins INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_quests_user_date ON public.daily_quests(user_id, quest_date);

-- Leaderboard: include is_ghost_mode_enabled for blur logic
CREATE OR REPLACE FUNCTION public.get_leaderboard_60min(p_limit INTEGER DEFAULT 3)
RETURNS TABLE(user_id TEXT, total_spent BIGINT, rank_position INTEGER, is_ghost_mode_enabled BOOLEAN)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH ranked AS (
    SELECT
      w.user_id,
      SUM(wt.amount)::BIGINT AS total_spent,
      ROW_NUMBER() OVER (ORDER BY SUM(wt.amount) DESC) AS rn
    FROM public.wallet_transactions wt
    JOIN public.wallets w ON wt.wallet_id = w.id
    WHERE wt.type = 'spend'
      AND wt.created_at > now() - interval '60 minutes'
    GROUP BY w.user_id
  )
  SELECT
    ranked.user_id,
    ranked.total_spent,
    ranked.rn::INTEGER,
    COALESCE(up.is_ghost_mode_enabled, false)
  FROM ranked
  LEFT JOIN public.user_profiles up ON up.user_id = ranked.user_id
  WHERE ranked.rn <= p_limit
  ORDER BY ranked.rn;
$$;

-- Daily Quest: increment messages (when task_type is 'messages')
CREATE OR REPLACE FUNCTION public.daily_quest_increment_messages(p_user_id TEXT)
RETURNS TABLE(count INTEGER, completed BOOLEAN, just_completed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_quest RECORD;
  v_new_value INTEGER;
  v_just_completed BOOLEAN := false;
BEGIN
  -- Ensure quest exists (random: 50% connections, 50% messages)
  INSERT INTO public.daily_quests (user_id, quest_date, task_type, target_value, current_value, completed, reward_coins, updated_at)
  VALUES (p_user_id, v_today, CASE WHEN random() < 0.5 THEN 'connections' ELSE 'messages' END, 5, 0, false, 5, now())
  ON CONFLICT (user_id, quest_date) DO NOTHING;

  SELECT * INTO v_quest FROM public.daily_quests WHERE user_id = p_user_id AND quest_date = v_today;
  IF v_quest.task_type != 'messages' THEN
    RETURN QUERY SELECT v_quest.current_value::INTEGER, v_quest.completed, false;
    RETURN;
  END IF;

  v_new_value := LEAST(v_quest.current_value + 1, v_quest.target_value);

  IF v_new_value >= v_quest.target_value AND NOT v_quest.completed THEN
    v_just_completed := true;
    PERFORM public.wallet_add(p_user_id, 5, 'daily_quest_' || v_today::TEXT, 'daily_quest');
  END IF;

  UPDATE public.daily_quests
  SET current_value = v_new_value, completed = (v_new_value >= target_value), updated_at = now()
  WHERE user_id = p_user_id AND quest_date = v_today;

  RETURN QUERY SELECT v_new_value::INTEGER, (v_new_value >= v_quest.target_value), v_just_completed;
END;
$$;

-- Daily Quest: connections - random task (connections or messages), 5 coins on completion
CREATE OR REPLACE FUNCTION public.daily_quest_ensure_and_increment_connections(
  p_user_id TEXT,
  p_connection_duration_ms INTEGER
)
RETURNS TABLE(count INTEGER, completed BOOLEAN, just_completed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_quest RECORD;
  v_new_value INTEGER;
  v_just_completed BOOLEAN := false;
BEGIN
  INSERT INTO public.daily_quests (user_id, quest_date, task_type, target_value, current_value, completed, reward_coins, updated_at)
  SELECT p_user_id, v_today,
    (ARRAY['connections','messages'])[1 + (random() < 0.5)::int],
    5, 0, false, 5, now()
  WHERE NOT EXISTS (SELECT 1 FROM public.daily_quests WHERE user_id = p_user_id AND quest_date = v_today);

  SELECT * INTO v_quest FROM public.daily_quests WHERE user_id = p_user_id AND quest_date = v_today;
  IF v_quest.task_type != 'connections' THEN
    RETURN QUERY SELECT LEAST(v_quest.current_value, v_quest.target_value)::INTEGER, v_quest.completed, false;
    RETURN;
  END IF;

  IF p_connection_duration_ms < 15000 THEN
    RETURN QUERY SELECT LEAST(v_quest.current_value, v_quest.target_value)::INTEGER, v_quest.completed, false;
    RETURN;
  END IF;

  v_new_value := LEAST(v_quest.current_value + 1, v_quest.target_value);

  IF v_new_value >= v_quest.target_value AND NOT v_quest.completed THEN
    v_just_completed := true;
    PERFORM * FROM public.wallet_add(p_user_id, 5, 'daily_quest_' || v_today::TEXT, 'daily_quest');
  END IF;

  UPDATE public.daily_quests
  SET current_value = v_new_value, completed = (v_new_value >= target_value), updated_at = now()
  WHERE user_id = p_user_id AND quest_date = v_today;

  RETURN QUERY SELECT v_new_value::INTEGER, (v_new_value >= v_quest.target_value), v_just_completed;
END;
$$;
