-- UserWallet: wallets table linked to user_id with balance
-- Run this in Supabase SQL Editor or via: supabase db push

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

-- RLS: enable row-level security
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Policy: users can only read/update their own wallet (via service role we bypass RLS in API)
CREATE POLICY "Users can read own wallet" ON public.wallets
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Service role bypasses RLS; API routes use service role for server-side ops

-- Function: spend with row-level locking to prevent double-spending
CREATE OR REPLACE FUNCTION public.wallet_spend(
  p_user_id TEXT,
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Lock row for update (prevents concurrent double-spend)
  SELECT balance INTO v_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Wallet not found'::TEXT;
    RETURN;
  END IF;

  IF v_balance < p_amount THEN
    RETURN QUERY SELECT false, v_balance, 'Insufficient balance'::TEXT;
    RETURN;
  END IF;

  v_new_balance := v_balance - p_amount;

  UPDATE public.wallets
  SET balance = v_new_balance, updated_at = now()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT true, v_new_balance, NULL::TEXT;
END;
$$;

-- Function: add coins (idempotent by external_id to avoid double-credit)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('add', 'spend')),
  external_id TEXT UNIQUE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_external_id ON public.wallet_transactions(external_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);

-- Add function to credit wallet (with optional idempotency via external_id)
CREATE OR REPLACE FUNCTION public.wallet_add(
  p_user_id TEXT,
  p_amount INTEGER,
  p_external_id TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
  v_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Idempotency: if external_id provided and already used, return current balance
  IF p_external_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE external_id = p_external_id) THEN
      SELECT balance INTO v_new_balance FROM public.wallets WHERE user_id = p_user_id;
      RETURN QUERY SELECT true, COALESCE(v_new_balance, 0), 'Already credited'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Upsert wallet if not exists
  INSERT INTO public.wallets (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT id, balance INTO v_wallet_id, v_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_new_balance := v_balance + p_amount;

  UPDATE public.wallets
  SET balance = v_new_balance, updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions (wallet_id, amount, type, external_id, reason)
  VALUES (v_wallet_id, p_amount, 'add', p_external_id, p_reason);

  RETURN QUERY SELECT true, v_new_balance, NULL::TEXT;
END;
$$;
