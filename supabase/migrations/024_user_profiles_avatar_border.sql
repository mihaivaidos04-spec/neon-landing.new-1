-- Add avatar_border for Golden Avatar Border reward

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS avatar_border TEXT DEFAULT NULL;
