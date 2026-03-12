-- User missions: daily unique connections for "Mission of the Day"
-- Run in Supabase SQL Editor or via: supabase db push

CREATE TABLE IF NOT EXISTS public.user_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  mission_date DATE NOT NULL,
  connection_count INTEGER NOT NULL DEFAULT 0 CHECK (connection_count >= 0),
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_date)
);

CREATE INDEX IF NOT EXISTS idx_user_missions_user_date ON public.user_missions(user_id, mission_date);
