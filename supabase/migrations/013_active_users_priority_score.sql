-- Add priority_score and is_slow_queue for refined matching algorithm
-- priority_score = (has_active_subscription ? 10 : 0) + (coin_balance / 10)
-- is_slow_queue = true when coins=0 AND battery=0 (Quick Charge unavailable)

ALTER TABLE public.active_users
ADD COLUMN IF NOT EXISTS priority_score REAL NOT NULL DEFAULT 0;

ALTER TABLE public.active_users
ADD COLUMN IF NOT EXISTS is_slow_queue BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_active_users_priority_score
ON public.active_users(priority_score DESC)
WHERE status = 'waiting';

CREATE INDEX IF NOT EXISTS idx_active_users_is_slow_queue
ON public.active_users(is_slow_queue)
WHERE status = 'waiting';
