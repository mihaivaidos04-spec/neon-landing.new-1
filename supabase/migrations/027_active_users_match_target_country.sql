-- Target country for matching (ISO2). Seeker only pairs with peers whose User.country matches;
-- waiting users with this set only accept joiners whose User.country matches.
ALTER TABLE public.active_users
ADD COLUMN IF NOT EXISTS match_target_country TEXT NULL;

COMMENT ON COLUMN public.active_users.match_target_country IS 'ISO 3166-1 alpha-2; null = no country filter for this queue row';
