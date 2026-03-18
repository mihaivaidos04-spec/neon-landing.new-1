"use client";

import { useState, useEffect } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";

type Props = {
  locale: ContentLocale;
  userId: string | null;
  onOpenShop: () => void;
  onToggleChange?: (enabled: boolean) => void;
};

export default function GhostModeToggle({
  locale,
  userId,
  onOpenShop,
  onToggleChange,
}: Props) {
  const t = getContentT(locale);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch("/api/ghost/status")
      .then((r) => r.json())
      .then((d) => setEnabled(!!d.isGhostModeEnabled))
      .catch(() => {});
  }, [userId]);

  const handleToggle = async () => {
    if (!userId || loading) return;

    if (enabled) {
      setLoading(true);
      try {
        const res = await fetch("/api/ghost/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: false }),
        });
        if (res.ok) {
          setEnabled(false);
          onToggleChange?.(false);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("ghost-mode-changed", { detail: { enabled: false } }));
          }
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ghost/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: true }),
      });
      const data = await res.json();

      if (res.ok) {
        setEnabled(true);
        onToggleChange?.(true);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("ghost-mode-changed", { detail: { enabled: true } }));
        }
      } else if (res.status === 402 && data.needsPayment) {
        setShowPaywall(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
          enabled
            ? "bg-emerald-500/30 text-emerald-400 ring-1 ring-emerald-500/50"
            : "border border-white/20 text-white/70 hover:bg-white/10"
        }`}
        title={t.ghostModeLabel}
      >
        <span className={enabled ? "opacity-90" : "opacity-60"}>👻</span>
        <span className="hidden sm:inline">{t.ghostModeLabel}</span>
        {enabled && <span className="text-[10px]">ON</span>}
      </button>

      {showPaywall && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-violet-500/40 bg-black/95 p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-bold text-white">
              Invisibility is a premium feature
            </h3>
            <p className="mb-4 text-sm text-white/80">
              Unlock Ghost Mode now to browse anonymously. You need coins or a Ghost subscription.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPaywall(false);
                  onOpenShop();
                }}
                className="flex-1 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-600"
              >
                Unlock Ghost Mode
              </button>
              <button
                type="button"
                onClick={() => setShowPaywall(false)}
                className="rounded-xl border border-white/20 px-4 py-3 text-sm text-white/80 hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
