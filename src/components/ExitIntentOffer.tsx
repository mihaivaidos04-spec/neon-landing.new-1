"use client";

import { useState, useEffect, useCallback } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";

const STORAGE_KEY = "neon_exit_intent_seen";
const COUNTDOWN_SEC = 120; // 2 minutes

export function hasSeenExitIntent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setExitIntentSeen(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {}
}

type Props = {
  visible: boolean;
  onStay: () => void;
  onClose: () => void;
  locale?: ContentLocale;
};

export default function ExitIntentOffer({ visible, onStay, onClose, locale = "en" }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SEC);
  const t = getContentT(locale);

  const handleClose = useCallback(() => {
    setExitIntentSeen();
    onClose();
  }, [onClose]);

  // Reset countdown when shown
  useEffect(() => {
    if (visible) setSecondsLeft(COUNTDOWN_SEC);
  }, [visible]);

  // Countdown timer
  useEffect(() => {
    if (!visible || secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          handleClose();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [visible, secondsLeft, handleClose]);

  if (!visible) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[410] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div
        className="modal-neon w-full max-w-sm rounded-2xl border border-amber-500/40 p-6 shadow-2xl"
        style={{ boxShadow: "0 0 40px rgba(251, 191, 36, 0.2)" }}
      >
        <div className="mb-4 flex items-center gap-2 text-amber-400">
          <span className="text-2xl">⚡</span>
          <h3 className="text-lg font-bold">Ofertă limitată!</h3>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-white/90">
          Stai! Doar acum, primești <strong className="text-amber-400">+50% baterie</strong> la
          prima reîncărcare!
        </p>
        <div className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 py-3">
          <span className="text-xs font-medium text-white/70">Expiră în</span>
          <span
            className="font-mono text-xl font-bold tabular-nums text-amber-400"
            aria-live="polite"
          >
            {timeStr}
          </span>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onStay}
            className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-bold text-black transition-all hover:bg-amber-400 active:scale-[0.98]"
          >
            {t.exitIntentAccept}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-xl border border-white/20 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/10"
          >
            {t.exitIntentDecline}
          </button>
        </div>
      </div>
    </div>
  );
}
