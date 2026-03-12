-- Report-based matching suspension: 3 reports in 1h → 24h ban
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS matching_suspended_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ;
