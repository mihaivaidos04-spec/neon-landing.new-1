-- Referral bonus: 24h cooldown for share-to-refill battery
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS referral_bonus_last_claimed_at TIMESTAMPTZ;
