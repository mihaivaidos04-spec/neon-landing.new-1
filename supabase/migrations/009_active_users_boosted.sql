-- Add boosted_at to active_users for priority queue boost (10 coins, 5 min)
-- Users with boosted_at within last 5 minutes get priority in matching

ALTER TABLE public.active_users
ADD COLUMN IF NOT EXISTS boosted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_active_users_boosted_at
ON public.active_users(boosted_at DESC)
WHERE boosted_at IS NOT NULL;
