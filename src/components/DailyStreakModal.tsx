"use client";

import { useEffect, useRef, useState } from "react";
import type { DailyLoginCalendarCell } from "@/src/lib/daily-streak-login";
import type { ContentLocale } from "@/src/lib/content-i18n";

export type DailyStreakModalPayload = {
  currentStreak: number;
  coinsEarned: number;
  weeklyBadge: boolean;
  calendar: DailyLoginCalendarCell[];
  balance: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  payload: DailyStreakModalPayload | null;
  locale?: ContentLocale;
};

function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t);
}

export default function DailyStreakModal({ open, onClose, payload, locale = "en" }: Props) {
  const [displayCoins, setDisplayCoins] = useState(0);
  const rafRef = useRef<number | null>(null);
  const ro = locale === "ro";

  useEffect(() => {
    if (!open || !payload) {
      setDisplayCoins(0);
      return;
    }

    const target = payload.coinsEarned;
    if (target <= 0) {
      setDisplayCoins(0);
      return;
    }

    setDisplayCoins(0);
    const start = performance.now();
    const duration = 1100;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplayCoins(Math.round(easeOutQuad(t) * target));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [open, payload]);

  if (!open || !payload) return null;

  const calendar = Array.isArray(payload.calendar) ? payload.calendar : [];

  return (
    <div
      className="fixed inset-0 z-[255] flex items-center justify-center bg-black/88 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-streak-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-orange-500/35 bg-gradient-to-b from-[#1c0a08] via-[#120610] to-black p-6 shadow-[0_0_40px_rgba(251,146,60,0.25)]">
        <h2 id="daily-streak-title" className="text-center text-xl font-bold text-white sm:text-2xl">
          🔥 {ro ? "Ziua" : "Day"} {payload.currentStreak} {ro ? "șir!" : "Streak!"}
        </h2>
        <p className="mt-3 text-center text-lg font-semibold tabular-nums text-amber-200">
          {ro ? "Ai câștigat " : "You earned "}
          <span className="text-2xl text-white">{displayCoins}</span>
          {ro ? " monede!" : " coins!"}
        </p>

        <div className="mt-5 flex justify-between gap-1.5 sm:gap-2">
          {calendar.map((cell) => (
            <div
              key={cell.dayKey}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
              title={cell.dayKey}
            >
              <div
                className={`flex h-10 w-full max-w-[2.75rem] items-center justify-center rounded-lg border text-[10px] font-bold sm:h-12 sm:text-xs ${
                  cell.filled
                    ? "border-orange-400/60 bg-gradient-to-b from-orange-500/35 to-fuchsia-600/25 text-orange-100 shadow-[0_0_12px_rgba(251,146,60,0.35)]"
                    : "border-white/10 bg-white/5 text-white/35"
                }`}
              >
                {cell.weekdayShort}
              </div>
              <span className="text-[8px] text-white/40">{cell.dayKey.slice(5)}</span>
            </div>
          ))}
        </div>

        {payload.weeklyBadge && (
          <p className="mt-4 rounded-xl border border-fuchsia-500/40 bg-fuchsia-950/40 px-3 py-2 text-center text-sm font-semibold text-fuchsia-100">
            🔥 {ro ? "Insignă Săptămână Neon — 7 zile la rând!" : "Weekly Streak badge — 7 days strong!"}
          </p>
        )}

        <p className="mt-3 text-center text-xs text-white/45">
          {ro ? "Sold nou:" : "New balance:"}{" "}
          <span className="font-mono font-semibold text-emerald-300/90 tabular-nums">{payload.balance}</span>
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-orange-600 to-fuchsia-600 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(234,88,12,0.35)] transition hover:opacity-95"
        >
          {ro ? "Continuă" : "Continue"}
        </button>
      </div>
    </div>
  );
}
