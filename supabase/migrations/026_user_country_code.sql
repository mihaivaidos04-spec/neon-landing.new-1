-- Country/region for user (ISO 3166-1 alpha-2, e.g. RO, SA, US)
-- Used for flag display in leaderboard and community feel
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS user_country_code TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profiles_country ON public.user_profiles(user_country_code);

-- Leaderboard: include user_country_code for flag display
CREATE OR REPLACE FUNCTION public.get_leaderboard_60min(p_limit INTEGER DEFAULT 3)
RETURNS TABLE(user_id TEXT, total_spent BIGINT, rank_position INTEGER, is_ghost_mode_enabled BOOLEAN, user_country_code TEXT)
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
    COALESCE(up.is_ghost_mode_enabled, false),
    up.user_country_code
  FROM ranked
  LEFT JOIN public.user_profiles up ON up.user_id = ranked.user_id
  WHERE ranked.rn <= p_limit
  ORDER BY ranked.rn;
$$;
