import type { ContentLocale } from "./content-i18n";

/**
 * Social-proof toasts (UI only). Prices mirror coin packs in `billing-packs.ts` (2.99 / 5.00 / 6.99).
 */
export type SocialProofPurchaseEvent = {
  user: string;
  emoji: string;
  price: string;
  actionRo: string;
  actionEn: string;
};

export const SOCIAL_PROOF_PURCHASE_EVENTS: SocialProofPurchaseEvent[] = [
  { user: "Alex_R", actionRo: "a cumpărat VIP Bronze", actionEn: "purchased VIP Bronze", price: "2.99€", emoji: "⭐" },
  { user: "MihaelaDev", actionRo: "a cumpărat VIP Silver", actionEn: "purchased VIP Silver", price: "5.00€", emoji: "💎" },
  { user: "DanVibe", actionRo: "a cumpărat VIP Gold", actionEn: "purchased VIP Gold", price: "6.99€", emoji: "👑" },
  { user: "SaraH_99", actionRo: "a trimis un cadou", actionEn: "sent a gift", price: "2.99€", emoji: "🎁" },
  { user: "NoahBuzz", actionRo: "a cumpărat VIP Bronze", actionEn: "purchased VIP Bronze", price: "2.99€", emoji: "⭐" },
  { user: "EvaS", actionRo: "a cumpărat VIP Gold", actionEn: "purchased VIP Gold", price: "6.99€", emoji: "👑" },
  { user: "Vlad_M", actionRo: "a trimis un cadou", actionEn: "sent a gift", price: "5.00€", emoji: "🎁" },
  { user: "IvyNeon", actionRo: "a cumpărat VIP Silver", actionEn: "purchased VIP Silver", price: "5.00€", emoji: "💎" },
  { user: "AndreeaK", actionRo: "a cumpărat VIP Gold", actionEn: "purchased VIP Gold", price: "6.99€", emoji: "👑" },
  { user: "BenW", actionRo: "a trimis un cadou", actionEn: "sent a gift", price: "2.99€", emoji: "🎁" },
  { user: "JuliaOK", actionRo: "a cumpărat VIP Bronze", actionEn: "purchased VIP Bronze", price: "2.99€", emoji: "⭐" },
  { user: "CristiN", actionRo: "a cumpărat VIP Silver", actionEn: "purchased VIP Silver", price: "5.00€", emoji: "💎" },
];

export function pickRandomSocialProofPurchaseEvent(): SocialProofPurchaseEvent {
  const i = Math.floor(Math.random() * SOCIAL_PROOF_PURCHASE_EVENTS.length);
  return SOCIAL_PROOF_PURCHASE_EVENTS[i]!;
}

export function formatSocialProofPurchaseLine(locale: ContentLocale, e: SocialProofPurchaseEvent): string {
  const action = locale === "ro" ? e.actionRo : e.actionEn;
  return `${e.emoji} ${e.user} ${action} · ${e.price}`;
}
