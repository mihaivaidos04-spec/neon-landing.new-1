"use client";

import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import { getGiftCost } from "../lib/coins";

export type GiftId = "heart" | "rose" | "coffee" | "diamond";

export const GIFTS: { id: GiftId; emoji: string }[] = [
  { id: "heart", emoji: "❤️" },
  { id: "rose", emoji: "🌹" },
  { id: "coffee", emoji: "☕" },
  { id: "diamond", emoji: "💎" },
];

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
            className="btn-gradient-neon flex min-h-[52px] min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-xl border border-white/20 px-4 py-3 text-white transition-all active:scale-[0.96] hover:opacity-95 sm:min-h-[56px] sm:min-w-[72px]"
          >
            <span className="text-xl">{g.emoji}</span>
            <span className="text-[10px] font-medium">{cost} {t.coinsLabel}</span>
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
