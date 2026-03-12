"use client";

import { useState, useEffect } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";

type Props = {
  visible: boolean;
  onClose: () => void;
  balance: number;
  onSpend?: (amount: number, reason?: string) => Promise<boolean>;
  onRefetch?: () => Promise<void>;
  locale?: ContentLocale;
};

type Step = "ask" | "choose" | "playing" | "result";

export default function BonusMultiplierPopup({
  visible,
  onClose,
  balance,
  onSpend,
  onRefetch,
  locale = "ro",
}: Props) {
  const [step, setStep] = useState<Step>("ask");
  const [result, setResult] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const t = getContentT(locale);

  useEffect(() => {
    if (visible) {
      setStep("ask");
      setResult(null);
      setLoading(false);
    }
  }, [visible]);

  if (!visible) return null;

  const handleNo = () => {
    setStep("ask");
    setResult(null);
    onClose();
  };

  const handleYes = () => setStep("choose");

  const handleHeadsTails = async () => {
    if ((balance ?? 0) < 1 || !onSpend) {
      onClose();
      return;
    }
    setLoading(true);
    setStep("playing");
    try {
      const res = await fetch("/api/missions/bonus-multiplier", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResult(data?.won ?? false);
        await onRefetch?.();
      } else {
        setResult(false);
      }
    } catch {
      setResult(false);
    } finally {
      setLoading(false);
      setStep("result");
    }
  };

  const handleCloseResult = () => {
    setStep("ask");
    setResult(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t.bonusMultiplierTitle}
    >
      <div className="modal-neon mx-4 w-full max-w-sm rounded-2xl border border-[#8b5cf6]/40 p-6 shadow-[0_0_40px_rgba(139,92,246,0.3)]">
        {step === "ask" && (
          <>
            <p className="text-center text-lg font-medium text-white">
              {t.bonusMultiplierTitle}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleYes}
                className="flex-1 rounded-full bg-[#8b5cf6] py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
              >
                Da
              </button>
              <button
                type="button"
                onClick={handleNo}
                className="flex-1 rounded-full border border-white/25 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
              >
                {t.bonusMultiplierNo}
              </button>
            </div>
          </>
        )}

        {step === "choose" && (
          <>
            <p className="text-center text-sm text-white/80">
              {t.bonusMultiplierChoose}
            </p>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                disabled
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/50"
              >
                <span>{t.bonusMultiplierWatchAd}</span>
                <span className="text-xs">({t.bonusMultiplierAdComingSoon})</span>
              </button>
              <button
                type="button"
                onClick={handleHeadsTails}
                disabled={loading || (balance ?? 0) < 1}
                className="flex w-full items-center justify-between rounded-xl border border-[#8b5cf6]/50 bg-[#8b5cf6]/20 px-4 py-3 text-left text-sm font-medium text-white transition-all hover:bg-[#8b5cf6]/30 disabled:opacity-50"
              >
                <span>{t.bonusMultiplierHeadsTails}</span>
                <span className="text-xs text-[#a78bfa]">
                  {t.bonusMultiplierHeadsTailsCost}
                </span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setStep("ask")}
              className="mt-4 w-full rounded-full border border-white/20 py-2 text-xs text-white/60"
            >
              ← {t.bonusMultiplierBack}
            </button>
          </>
        )}

        {step === "playing" && (
          <p className="py-8 text-center text-white/80">...</p>
        )}

        {step === "result" && (
          <>
            <p className="text-center text-lg font-medium text-white">
              {result ? t.bonusMultiplierWin : t.bonusMultiplierLose}
            </p>
            <button
              type="button"
              onClick={handleCloseResult}
              className="mt-6 w-full rounded-full bg-[#8b5cf6] py-3 text-sm font-semibold text-white"
            >
              OK
            </button>
          </>
        )}
      </div>
    </div>
  );
}
