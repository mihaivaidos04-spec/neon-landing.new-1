-- User passes: active passes purchased via Stripe
-- Run in Supabase SQL Editor or via: supabase db push

CREATE TABLE IF NOT EXISTS public.user_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_id)
);

CREATE INDEX IF NOT EXISTS idx_user_passes_user_id ON public.user_passes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_passes_expires_at ON public.user_passes(expires_at);

-- Plan durations in hours (for Stripe webhook when crediting)
-- location: 1h, gender: 72h (3 days), fullpass: 168h (7 days), fullweek: 720h (30 days)
