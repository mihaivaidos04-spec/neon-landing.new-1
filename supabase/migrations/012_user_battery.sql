-- Battery level for video watch time (0-100)
-- Run: supabase db push (or apply manually)

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS battery_level INTEGER DEFAULT 100;
