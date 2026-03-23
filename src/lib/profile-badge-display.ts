import type { AutomaticBadgeType } from "@/src/lib/sync-automatic-badges";

export const AUTOMATIC_BADGE_UI: Record<
  AutomaticBadgeType,
  { emoji: string; label: string }
> & { weekly_streak: { emoji: string; label: string } } = {
  first_match: { emoji: "🎯", label: "First match" },
  "100_matches": { emoji: "🏆", label: "100 matches" },
  top_gifter: { emoji: "💎", label: "Top gifter" },
  vip: { emoji: "⭐", label: "VIP" },
  veteran: { emoji: "🔥", label: "Veteran" },
  weekly_streak: { emoji: "📅", label: "Weekly streak" },
};

export function badgeUi(type: string): { emoji: string; label: string } {
  const u = AUTOMATIC_BADGE_UI[type as AutomaticBadgeType];
  if (u) return u;
  return { emoji: "✨", label: type };
}
