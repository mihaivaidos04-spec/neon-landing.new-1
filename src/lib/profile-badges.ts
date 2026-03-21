import type { User } from "@prisma/client";

import { PROFILE_BADGE_DEFINITIONS } from "@/src/lib/profile-badge-defs";

export { PROFILE_BADGE_DEFINITIONS };
export type { ProfileBadgeDef } from "@/src/lib/profile-badge-defs";

const EARLY_ADOPTER_MIN_LEVEL = 3;
const TOP_SUPPORTER_MIN_SPENT = 2500;
const HIGH_ROLLER_MIN_SPENT = 12000;

export function computeProfileBadges(
  user: Pick<User, "totalCoinsSpent" | "currentLevel">
): {
  id: string;
  unlocked: boolean;
}[] {
  const spent = user.totalCoinsSpent ?? 0;
  const level = user.currentLevel ?? 1;

  return PROFILE_BADGE_DEFINITIONS.map((def) => {
    let unlocked = false;
    switch (def.id) {
      case "early_adopter":
        unlocked = level >= EARLY_ADOPTER_MIN_LEVEL;
        break;
      case "top_supporter":
        unlocked = spent >= TOP_SUPPORTER_MIN_SPENT;
        break;
      case "high_roller":
        unlocked = spent >= HIGH_ROLLER_MIN_SPENT;
        break;
      default:
        unlocked = false;
    }
    return { id: def.id, unlocked };
  });
}
