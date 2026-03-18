"use client";

import { useState, useEffect } from "react";

const BONUS_DURATION_MS = 15 * 60 * 1000; // 15 minutes

type Props = {
  hasEverPurchased: boolean;
  loginAt: number; // timestamp when user logged in
  onOpenShop: () => void;
};

export default function FirstPurchaseBonusTimer({
  hasEverPurchased,
  loginAt,
  onOpenShop,
}: Props) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (hasEverPurchased) return;

    const endAt = loginAt + BONUS_DURATION_MS;
    const tick = () => {
      const now = Date.now();
      if (now >= endAt) {
        setRemainingMs(0);
        return;
      }
      setRemainingMs(endAt - now);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [hasEverPurchased, loginAt]);

  if (hasEverPurchased || remainingMs === null || remainingMs <= 0) return null;

  const mins = Math.floor(remainingMs / 60000);
  const secs = Math.floor((remainingMs % 60000) / 1000);
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <button
      type="button"
      onClick={onOpenShop}
      className="fixed bottom-20 right-4 z-50 flex flex-col gap-0.5 rounded-xl border border-amber-500/50 bg-amber-950/90 px-3 py-2 shadow-lg backdrop-blur-sm transition-all hover:border-amber-400/70 hover:bg-amber-900/50 sm:left-auto sm:right-6"
      style={{ boxShadow: "0 0 20px rgba(251, 191, 36, 0.3)" }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
        First Purchase Bonus
      </span>
      <span className="text-lg font-bold text-amber-300">2x Coins</span>
      <span className="text-xs text-amber-400/80">Expires in {timeStr}</span>
    </button>
  );
}
