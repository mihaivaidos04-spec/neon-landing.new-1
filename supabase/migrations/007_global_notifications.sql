-- Global notifications for Realtime social proof (God Mode, 7-day streak)
-- Run in Supabase SQL Editor or via: supabase db push
--
-- Clients subscribe to INSERT via Postgres Realtime to show toasts to everyone online.

CREATE TABLE IF NOT EXISTS public.global_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('god_mode', 'streak_7')),
  user_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_global_notifications_created ON public.global_notifications(created_at DESC);

-- RLS: allow anyone to read (for Realtime subscription)
ALTER TABLE public.global_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read global notifications" ON public.global_notifications
  FOR SELECT USING (true);

-- Enable Realtime: add table to supabase_realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.global_notifications';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL; -- already added
END;
$$
