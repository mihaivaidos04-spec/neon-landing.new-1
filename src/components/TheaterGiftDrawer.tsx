"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import FuturisticGiftIcon from "./FuturisticGiftIcon";
import { getContentT } from "../lib/content-i18n";
import { GIFTS, getGiftName } from "./GiftsBar";
import {
  type TheaterGiftId,
  canAffordTheaterGift,
  getTheaterGiftApproxUsdLabel,
  getTheaterGiftCost,
} from "../lib/theater-gifts";

const EXTRA_THEATER_GIFTS: { id: Extract<TheaterGiftId, "fire" | "rocket"> }[] = [
  { id: "fire" },
  { id: "rocket" },
];

const THEATER_GIFT_EMOJI: Record<TheaterGiftId, string> = {
  heart: "❤️",
  rose: "🌹",
  coffee: "☕",
  diamond: "💎",
  fire: "🔥",
  rocket: "🚀",
};

function theaterGiftLabel(id: TheaterGiftId, locale: ContentLocale): string {
  if (id === "fire") return "Fire";
  if (id === "rocket") return "Rocket";
  return getGiftName(id, locale);
}

type Props = {
  locale: ContentLocale;
  coins: number;
  onSelectGift: (giftId: TheaterGiftId) => void;
  /** When false, drawer is not shown (e.g. not in a live match). */
  enabled: boolean;
};

/**
 * Theater overlay: FAB bottom-right stack (above PiP), 2×2 grid with USD + coin price; parent runs coin check.
 */
export default function TheaterGiftDrawer({ locale, coins, onSelectGift, enabled }: Props) {
  const t = getContentT(locale);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handlePick = useCallback(
    (id: TheaterGiftId) => {
      onSelectGift(id);
      setOpen(false);
    },
    [onSelectGift]
  );

  if (!enabled) return null;

  return (
    <div
      ref={rootRef}
      className="pointer-events-auto absolute bottom-[8rem] right-3 z-[35] sm:bottom-[8.75rem] sm:right-3"
    >
      {open && (
        <div
          className="mb-2 w-[min(17.5rem,calc(100vw-2rem))] rounded-2xl border border-white/12 bg-[#07060c]/95 p-3 shadow-[0_0_40px_rgba(139,92,246,0.35),0_12px_40px_rgba(0,0,0,0.65)] backdrop-blur-xl"
          role="dialog"
          aria-label="Gifts"
        >
          <p className="mb-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-fuchsia-200/90">
            Send a gift
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[...GIFTS, ...EXTRA_THEATER_GIFTS].map((g) => {
              const id = g.id as TheaterGiftId;
              const cost = getTheaterGiftCost(id);
              const usd = getTheaterGiftApproxUsdLabel(id);
              const affordable = canAffordTheaterGift(coins, id);
              const label = theaterGiftLabel(id, locale);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handlePick(id)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-center transition active:scale-[0.97] ${
                    affordable
                      ? "border-fuchsia-500/35 bg-gradient-to-b from-fuchsia-950/50 to-black/50 hover:border-fuchsia-400/55 hover:from-fuchsia-900/40"
                      : "border-white/10 bg-black/40 opacity-80 hover:border-amber-500/30 hover:opacity-100"
                  }`}
                >
                  <span className="gift-emoji-future-wrap shrink-0" aria-hidden>
                    <span className="emoji-ios text-2xl leading-none">{THEATER_GIFT_EMOJI[id]}</span>
                  </span>
                  <span className="max-w-full truncate text-[11px] font-semibold text-white/95">{label}</span>
                  <span className="gift-price-text text-[10px] text-[var(--color-text-secondary)]">{usd}</span>
                  <span className="gift-price-text number-plain text-[9px] text-[var(--color-text-secondary)]">
                    {cost.toLocaleString("en-US")} {t.coinsLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full border border-fuchsia-400/50 bg-gradient-to-br from-fuchsia-600/90 to-violet-700/90 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-[0_0_22px_rgba(217,70,239,0.55),0_0_36px_rgba(99,102,241,0.35)] transition hover:brightness-110 active:scale-[0.98] sm:min-h-12 sm:min-w-[4.25rem] sm:text-[11px]"
      >
        <FuturisticGiftIcon size={21} />
        <span className="hidden sm:inline">Gift</span>
      </button>
    </div>
  );
}
