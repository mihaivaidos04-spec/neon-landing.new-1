-- Stripe Payment Intent log for admin metrics (real-time, includes failed/test)
CREATE TABLE IF NOT EXISTS public.stripe_payment_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  payment_intent_id TEXT,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  status TEXT,
  livemode BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_payment_log_created ON public.stripe_payment_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_payment_log_pi ON public.stripe_payment_log(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payment_log_livemode ON public.stripe_payment_log(livemode);
