-- Match filters: user gender + verified flag
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Match history: users seen in last 10 min (for Global Shuffle)
CREATE TABLE IF NOT EXISTS public.match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  seen_user_id TEXT NOT NULL,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_history_user_seen
ON public.match_history(user_id, seen_at);
