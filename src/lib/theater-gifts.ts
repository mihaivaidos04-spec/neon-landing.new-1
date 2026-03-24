import type { GiftId } from "@/src/components/GiftsBar";
import { COINS_PER_USD_HINT } from "@/src/lib/coins";

/** Theater drawer: standard gifts + premium Fire / Rocket (Socket overlay on partner video). */
export type TheaterGiftId = GiftId | "fire" | "rocket";

export const THEATER_GIFT_COST: Record<TheaterGiftId, number> = {
  heart: 2,
  rose: 10,
  coffee: 10,
  diamond: 40,
  fire: 50,
  rocket: 500,
};

export function getTheaterGiftCost(id: TheaterGiftId): number {
  return THEATER_GIFT_COST[id] ?? 0;
}

export function canAffordTheaterGift(balance: number, id: TheaterGiftId): boolean {
  return balance >= getTheaterGiftCost(id);
}

export const THEATER_OVERLAY_GIFT_TYPES = ["fire", "rocket"] as const;
export type TheaterOverlayGiftType = (typeof THEATER_OVERLAY_GIFT_TYPES)[number];

export function isTheaterOverlayGift(
  id: string
): id is TheaterOverlayGiftType {
  return THEATER_OVERLAY_GIFT_TYPES.includes(id as TheaterOverlayGiftType);
}

/** ~USD hint for display only (same scale as getGiftApproxUsdLabel). */
export function getTheaterGiftApproxUsdLabel(id: TheaterGiftId): string {
  const cost = getTheaterGiftCost(id);
  const usd = cost / COINS_PER_USD_HINT;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usd);
}
