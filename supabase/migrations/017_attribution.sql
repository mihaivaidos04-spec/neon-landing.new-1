-- Attribution: UTM params and referral tracking
-- signup_source: utm_source (e.g. google, facebook)
-- utm_medium, utm_campaign: optional campaign fields
-- referred_by_id: from ?ref=USER_ID

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS signup_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS referred_by_id TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profiles_referred_by ON public.user_profiles(referred_by_id);
