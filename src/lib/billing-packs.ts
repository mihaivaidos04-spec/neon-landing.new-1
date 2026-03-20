/**
 * Neon Coins billing packs — server-side source of truth for /billing + Stripe Checkout.
 * Clients send { amount, coinsAmount }; we validate against this list (anti-tamper).
 */

export type BillingPackId = "micro" | "standard" | "mega";

export type BillingPack = {
  id: BillingPackId;
  /** Card title in UI */
  label: string;
  coins: number;
  /** USD (e.g. 0.69) */
  priceUsd: number;
  /** Stripe unit_amount = Math.round(priceUsd * 100) — always integer cents */
  amountCents: number;
  popular?: boolean;
};

export const BILLING_PACKS: BillingPack[] = [
  {
    id: "micro",
    label: "Micro Pack",
    coins: 100,
    priceUsd: 0.69,
    amountCents: 69,
  },
  {
    id: "standard",
    label: "Standard Pack",
    coins: 350,
    priceUsd: 1.99,
    amountCents: 199,
    popular: true,
  },
  {
    id: "mega",
    label: "Mega Pack",
    coins: 500,
    priceUsd: 2.49,
    amountCents: 249,
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
  return id === "micro" || id === "standard" || id === "mega";
}
