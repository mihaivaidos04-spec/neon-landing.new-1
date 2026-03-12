-- Leaderboard: track spend for 60-min rolling window
-- 1. Update wallet_spend to record spend transactions
-- 2. Add index for leaderboard query
-- 3. Create leaderboard function

-- Update wallet_spend to insert spend transaction for leaderboard tracking
CREATE OR REPLACE FUNCTION public.wallet_spend(
  p_user_id TEXT,
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
  v_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  SELECT id, balance INTO v_wallet_id, v_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Wallet not found'::TEXT;
    RETURN;
  END IF;

  IF v_balance < p_amount THEN
    RETURN QUERY SELECT false, v_balance, 'Insufficient balance'::TEXT;
    RETURN;
  END IF;

  v_new_balance := v_balance - p_amount;

  UPDATE public.wallets
  SET balance = v_new_balance, updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions (wallet_id, amount, type, reason)
  VALUES (v_wallet_id, p_amount, 'spend', p_reason);

  RETURN QUERY SELECT true, v_new_balance, NULL::TEXT;
END;
$$;

-- Index for leaderboard query (spend in last 60 min)
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_spend_created
ON public.wallet_transactions(created_at DESC)
WHERE type = 'spend';

-- Function: top 3 users by spend in last 60 minutes
CREATE OR REPLACE FUNCTION public.get_leaderboard_60min(p_limit INTEGER DEFAULT 3)
RETURNS TABLE(user_id TEXT, total_spent BIGINT, rank_position INTEGER)
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
  SELECT ranked.user_id, ranked.total_spent, ranked.rn::INTEGER
  FROM ranked
  WHERE ranked.rn <= p_limit
  ORDER BY ranked.rn;
$$;
