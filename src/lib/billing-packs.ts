/**
 * Neon Coins billing packs — server-side source of truth for /billing + Stripe Checkout.
 * Clients send { amount, coinsAmount }; we validate against this list (anti-tamper).
 */

export type BillingPackId = "starter" | "popular" | "whale";

export type BillingPack = {
  id: BillingPackId;
  /** Card title in UI */
  label: string;
  /** Total coins credited (base + bonus) */
  coins: number;
  /** Shown on card: coins before bonus */
  baseCoins: number;
  bonusCoins: number;
  /** USD (e.g. 0.99) */
  priceUsd: number;
  /** Stripe unit_amount = Math.round(priceUsd * 100) — always integer cents */
  amountCents: number;
  popular?: boolean;
};

export const BILLING_PACKS: BillingPack[] = [
  {
    id: "starter",
    label: "Starter Pack",
    baseCoins: 75,
    bonusCoins: 0,
    coins: 75,
    priceUsd: 2.99,
    amountCents: 299,
  },
  {
    id: "popular",
    label: "Popular",
    baseCoins: 400,
    bonusCoins: 40,
    coins: 440,
    priceUsd: 5.0,
    amountCents: 500,
    popular: true,
  },
  {
    id: "whale",
    label: "Whale Pack",
    baseCoins: 1500,
    bonusCoins: 200,
    coins: 1700,
    priceUsd: 6.99,
    amountCents: 699,
  },
];

export function getBillingPackById(id: string): BillingPack | undefined {
  return BILLING_PACKS.find((p) => p.id === id);
}

/**
 * Resolve a pack from client-supplied USD amount + coin count.
 * Uses integer cents: Math.round(amount * 100) must match pack.amountCents.
 */
export function findBillingPackByAmountAndCoins(
  amountUsd: number,
  coinsAmount: number
): BillingPack | undefined {
  if (!Number.isFinite(amountUsd) || !Number.isFinite(coinsAmount)) return undefined;
  const cents = Math.round(amountUsd * 100);
  return BILLING_PACKS.find((p) => p.amountCents === cents && p.coins === coinsAmount);
}

export function isBillingPackId(id: string): id is BillingPackId {
  return id === "starter" || id === "popular" || id === "whale";
}
