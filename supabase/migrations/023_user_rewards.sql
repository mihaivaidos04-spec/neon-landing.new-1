-- User rewards: pending digital rewards from purchases (Lemon Squeezy, etc.)
-- Decrypt flow: status pending -> decrypted, benefit applied

CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  reward_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'decrypted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_rewards_user_status ON public.user_rewards(user_id, status);
