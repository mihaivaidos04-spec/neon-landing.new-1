/**
 * Chill Coin (Bănuți) economy: costs and package definitions.
 */

import type { GiftId } from "../components/GiftsBar";
import { BILLING_PACKS } from "./billing-packs";

/** Micro pack rate for ~USD hints in UI (100 coins ≈ $0.69). */
const GIFT_USD_REFERENCE_PACK = BILLING_PACKS.find((p) => p.id === "micro") ?? BILLING_PACKS[0];

/** Cost in coins per gift */
export const GIFT_COST: Record<GiftId, number> = {
  heart: 2,
  rose: 10,
  coffee: 10,
  diamond: 40,
};

/** Location/Language filter 30 min */
export const FILTER_30MIN_COST = 15;

/** Cost in coins for a single filtered skip (when no active pass) */
export const FILTER_SKIP_COST = 5;

/** Beauty Blur cost per minute (after free 30s trial) */
export const BEAUTY_BLUR_COST_PER_MIN = 2;

/** Ghost Mode: 1 coin per 2 minutes (incognito browsing, Spy filter) */
export const GHOST_MODE_COST_PER_2MIN = 1;
export const GHOST_MODE_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

/** Icebreaker: 1 coin to send pre-written opener */
export const ICEBREAKER_COST = 1;

/** Live translation subtitles: coins per minute */
export const LIVE_TRANSLATION_COST_PER_MIN = 3;

/** Private room: host pays per minute to keep room open */
export const PRIVATE_ROOM_COST_PER_MIN = 5;

/** Priority boost: 10 coins for 5 min queue priority */
export const PRIORITY_BOOST_COST = 10;

/** Undo Next: 3 coins to reconnect with previous partner */
export const UNDO_NEXT_COST = 3;

/** Instant Reveal: 1 coin to remove partner video blur immediately */
export const INSTANT_REVEAL_COST = 1;

/** Battery Quick Charge: 5 coins for +25% (one segment) */
export const BATTERY_QUICK_CHARGE_COST = 5;
export const BATTERY_QUICK_CHARGE_AMOUNT = 25;

/** Queue preview: cost to unlock (remove blur) for one user */
export const QUEUE_UNLOCK_COST = 2;

/** Mystery Box: 5 coins to open, weighted random rewards */
export const MYSTERY_BOX_COST = 5;
export const MYSTERY_BOX_SMALL_REWARD = 3;
export const MYSTERY_BOX_BIG_REWARD = 25;

/** Reaction overlay costs (sent to peer) */
export const REACTION_COST: Record<string, number> = {
  heart: 1,
  fire: 2,
  laugh: 2,
  love: 3,
  wow: 3,
};

/** Demo: starting balance for new users */
export const INITIAL_COINS = 10;

/** Coin packages in shop (world prices in USD) */
export const COIN_PACKAGES = [
  // Apple-style psychological tiers
  // Starter: 50 coins – 1.49$
  { id: "small", coins: 50, priceUsd: 1.49, featured: false },
  // Pro: 150 coins + 20 bonus = 170 coins – 3.49$
  { id: "medium", coins: 170, priceUsd: 3.49, featured: true },
  // Elite: 300 coins – 4.99$
  { id: "large", coins: 300, priceUsd: 4.99, featured: false },
] as const;

export type CoinPackageId = (typeof COIN_PACKAGES)[number]["id"];

export function getGiftCost(giftId: GiftId): number {
  return GIFT_COST[giftId] ?? 0;
}

export function canAffordGift(balance: number, giftId: GiftId): boolean {
  return balance >= getGiftCost(giftId);
}

/** Approximate fiat label from micro-pack pricing (theater / shop hints). */
export function getGiftApproxUsdLabel(giftId: GiftId): string {
  const cost = getGiftCost(giftId);
  const usd =
    (cost / GIFT_USD_REFERENCE_PACK.coins) * GIFT_USD_REFERENCE_PACK.priceUsd;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usd);
}

export function getReactionCost(reactionId: string): number {
  return REACTION_COST[reactionId] ?? 1;
}
