export type ProfileBadgeDef = {
  id: string;
  labelKey: string;
  descKey: string;
};

/** Ordered badges shown on profile; unlock logic in `profile-badges.ts` (server) */
export const PROFILE_BADGE_DEFINITIONS: ProfileBadgeDef[] = [
  {
    id: "early_adopter",
    labelKey: "profile.badgeEarlyAdopter",
    descKey: "profile.badgeEarlyAdopterDesc",
  },
  {
    id: "top_supporter",
    labelKey: "profile.badgeTopSupporter",
    descKey: "profile.badgeTopSupporterDesc",
  },
  {
    id: "high_roller",
    labelKey: "profile.badgeHighRoller",
    descKey: "profile.badgeHighRollerDesc",
  },
];
