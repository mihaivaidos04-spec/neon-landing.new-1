-- Daily Reward: first login of day = 5% battery, 7-day streak = Gold Badge
-- last_login_date: date of last daily reward claim (YYYY-MM-DD)
-- streak_count: consecutive days of login
-- gold_badge_expires_at: when the 7-day Gold Badge expires (24h from unlock)

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS last_login_date DATE;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS streak_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS gold_badge_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_profiles_last_login
ON public.user_profiles(user_id)
WHERE last_login_date IS NOT NULL;
