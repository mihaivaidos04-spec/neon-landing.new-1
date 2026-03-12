-- Reactions: sent from user to peer, triggers overlay animation
-- Run in Supabase SQL Editor or via: supabase db push
-- Clients subscribe via Postgres Realtime to show overlay when to_user receives

CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reactions_to_user ON public.reactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_created ON public.reactions(created_at DESC);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read reactions sent to them" ON public.reactions
  FOR SELECT USING (true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;
