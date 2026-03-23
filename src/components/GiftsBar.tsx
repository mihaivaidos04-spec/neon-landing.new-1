"use client";

import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import { getGiftCost } from "../lib/coins";

export type GiftId = "heart" | "rose" | "coffee" | "diamond";

export const GIFTS: { id: GiftId }[] = [
  { id: "heart" },
  { id: "rose" },
  { id: "coffee" },
  { id: "diamond" },
];

const GIFT_EMOJI: Record<GiftId, string> = {
  heart: "❤️",
  rose: "🌹",
  coffee: "☕",
  diamond: "💎",
};

type Props = {
  locale: ContentLocale;
  coins: number;
  onSendGift: (giftId: GiftId) => void;
};

export default function GiftsBar({ locale, coins, onSendGift }: Props) {
  const t = getContentT(locale);

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {GIFTS.map((g) => {
        const cost = getGiftCost(g.id);
        const canAfford = coins >= cost;
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onSendGift(g.id)}
            disabled={!canAfford}
            className="flex min-h-[52px] min-w-[64px] flex-col items-center justify-center gap-1 rounded-xl border border-white/15 bg-black/45 px-4 py-3 text-white shadow-[0_0_24px_rgba(139,92,246,0.12)] transition-all active:scale-[0.96] hover:border-fuchsia-500/30 hover:bg-black/55 disabled:opacity-45 sm:min-h-[56px] sm:min-w-[72px]"
          >
            <span className="gift-emoji-future-wrap shrink-0">
              <span className="emoji-ios text-xl leading-none">{GIFT_EMOJI[g.id]}</span>
            </span>
            <span className="gift-price-text number-plain text-[10px] text-[var(--color-text-secondary)]">
              {cost.toLocaleString("en-US")} {t.coinsLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function getGiftName(giftId: GiftId, locale: ContentLocale): string {
  const t = getContentT(locale);
  const key = giftId as keyof typeof t.giftNames;
  return t.giftNames[key];
}
