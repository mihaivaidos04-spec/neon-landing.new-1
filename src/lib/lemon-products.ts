/**
 * Lemon Squeezy products – Digital Rewards (Software Enhancements).
 * Set variant IDs in .env.local: LEMON_SQUEEZY_VARIANT_STARTER, LEMON_SQUEEZY_VARIANT_NEON, LEMON_SQUEEZY_VARIANT_HYPER
 */

export const LEMON_PRODUCTS = [
  {
    id: "starter",
    name: "Starter Spark",
    price: 0.99,
    rewards: 1,
    variantId: process.env.NEXT_PUBLIC_LEMON_VARIANT_STARTER ?? "",
    features: ["Unlock priority matching", "1 Digital Reward"],
    badge: null as string | null,
    isBestValue: false,
  },
  {
    id: "neon",
    name: "Neon Pack",
    price: 2.49,
    rewards: 3,
    variantId: process.env.NEXT_PUBLIC_LEMON_VARIANT_NEON ?? "",
    features: ["Extended battery", "Unlock priority matching", "3 Digital Rewards"],
    badge: null as string | null,
    isBestValue: false,
  },
  {
    id: "hyper",
    name: "Hyper Bundle",
    price: 3.99,
    rewards: 7,
    variantId: process.env.NEXT_PUBLIC_LEMON_VARIANT_HYPER ?? "",
    features: ["Extended battery", "Unlock priority matching", "Ad-free experience", "7 Digital Rewards"],
    badge: "BEST VALUE" as string | null,
    isBestValue: true,
  },
  {
    id: "ghost",
    name: "Go Ghost",
    price: 1.99,
    rewards: 0,
    variantId: process.env.NEXT_PUBLIC_LEMON_VARIANT_GHOST ?? "",
    features: ["Hide your profile in leaderboard", "Privacy in live list"],
    badge: null as string | null,
    isBestValue: false,
  },
] as const;

export type LemonProductId = (typeof LEMON_PRODUCTS)[number]["id"];

export function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}
