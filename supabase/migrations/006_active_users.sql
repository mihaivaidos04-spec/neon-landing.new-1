-- Active users in the matching pool (priority-based queue)
-- Run in Supabase SQL Editor or via: supabase db push
--
-- is_priority: true for VIP Pass (fullpass/fullweek) or >500 coins
-- Priority users are matched first; Fast Match can "steal" partners from non-priority pairs

CREATE TABLE IF NOT EXISTS public.active_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  is_priority BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched')),
  partner_id TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  matched_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_active_users_status ON public.active_users(status);
CREATE INDEX IF NOT EXISTS idx_active_users_is_priority ON public.active_users(is_priority);
CREATE INDEX IF NOT EXISTS idx_active_users_joined_at ON public.active_users(joined_at);
CREATE INDEX IF NOT EXISTS idx_active_users_partner ON public.active_users(partner_id) WHERE partner_id IS NOT NULL;

-- RLS: users can read their own row
ALTER TABLE public.active_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own active_users row" ON public.active_users
  FOR SELECT USING (auth.uid()::text = user_id OR auth.uid()::text = partner_id);
