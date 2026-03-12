-- Mystery Box: Rare sticker unlock flag
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS rare_sticker_unlocked BOOLEAN DEFAULT false;
