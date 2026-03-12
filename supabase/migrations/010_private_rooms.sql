-- Private rooms: host pays per minute, closed when insufficient balance
-- Server checks every 60 seconds

CREATE TABLE IF NOT EXISTS public.private_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id TEXT NOT NULL,
  guest_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_private_rooms_status ON public.private_rooms(status);
CREATE INDEX IF NOT EXISTS idx_private_rooms_host ON public.private_rooms(host_user_id);
CREATE INDEX IF NOT EXISTS idx_private_rooms_guest ON public.private_rooms(guest_user_id);

ALTER TABLE public.private_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own private_rooms" ON public.private_rooms
  FOR SELECT USING (auth.uid()::text = host_user_id OR auth.uid()::text = guest_user_id);
