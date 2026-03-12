-- Retention: 10% battery regen every 2 hours, max 50%
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS last_battery_regen_at TIMESTAMPTZ;
