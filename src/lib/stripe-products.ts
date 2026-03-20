/**
 * Stripe Checkout plans — NeonLive Digital Content Creator Platform.
 * Credits are in-app platform balance (wallet) for creator tools, matching priority, and features.
 */

export type StripePlanId = "essential" | "creator" | "studio" | "privacy_plus";

export type StripePlan = {
  id: StripePlanId;
  /** Display name — premium SaaS tone */
  name: string;
  /** Short subtitle for checkout UI */
  tagline: string;
  amountCents: number;
  /** Credits added to wallet (0 for privacy-only) */
  credits: number;
  /** Enable Ghost / privacy listing feature */
  enableGhostMode: boolean;
  highlights: string[];
  recommended?: boolean;
};

export const STRIPE_PLANS: StripePlan[] = [
  {
    id: "essential",
    name: "Essential",
    tagline: "Start creating on NeonLive",
    amountCents: 99,
    credits: 150,
    enableGhostMode: false,
    highlights: ["Platform credits for creator features", "Priority matching access", "Instant delivery"],
  },
  {
    id: "creator",
    name: "Creator",
    tagline: "For active creators",
    amountCents: 249,
    credits: 450,
    enableGhostMode: false,
    highlights: ["Higher credit balance", "Extended session tools", "Full feature access"],
  },
  {
    id: "studio",
    name: "Studio",
    tagline: "Maximum value for professionals",
    amountCents: 399,
    credits: 1000,
    enableGhostMode: false,
    recommended: true,
    highlights: ["Largest credit package", "Ad-light experience", "Best cost per credit"],
  },
  {
    id: "privacy_plus",
    name: "Privacy Plus",
    tagline: "Enhanced listing privacy",
    amountCents: 199,
    credits: 0,
    enableGhostMode: true,
    highlights: ["Privacy-focused profile display", "Leaderboard visibility controls", "One-time activation"],
  },
];

export function getStripePlanById(id: string): StripePlan | undefined {
  return STRIPE_PLANS.find((p) => p.id === id);
}
