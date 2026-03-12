-- Moderation logs for manual review
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  partner_id TEXT,
  violation_type TEXT NOT NULL,
  nudity_probability NUMERIC(5,4),
  weapon_probability NUMERIC(5,4),
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_user ON public.moderation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created ON public.moderation_logs(created_at DESC);
