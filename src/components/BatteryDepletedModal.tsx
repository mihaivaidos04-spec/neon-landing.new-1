"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import toast from "react-hot-toast";
import { buildInviteShareUrl } from "@/src/lib/invite-share";

type Props = {
  locale: ContentLocale;
  visible: boolean;
  onQuickCharge: () => void;
  onOpenShop: () => void;
  /** Navigate to checkout with starter bundle for full recharge (auth users) */
  onRechargeWithPayment?: () => void;
  canAfford: boolean;
  loading?: boolean;
  /** True if user is authenticated (can pay) */
  isAuthenticated?: boolean;
  /** Current user ID for referral link (ref param). Required for Refill 25% share button. */
  userId?: string | null;
  /** Called when referral bonus is awarded (to refresh battery display) */
  onBatteryRefilled?: () => void;
};

function buildShareUrl(userId: string): string {
  if (typeof window === "undefined") return "";
  const origin = window.location.origin;
  return `${origin}?ref=${encodeURIComponent(userId)}`;
}

function buildShareText(userId: string): string {
  const url = buildShareUrl(userId);
  return `Check this out: ${url}`;
}

export default function BatteryDepletedModal({
  locale,
  visible,
  onQuickCharge,
  onOpenShop,
  onRechargeWithPayment,
  canAfford,
  loading = false,
  isAuthenticated = false,
  userId = null,
  onBatteryRefilled,
}: Props) {
  const t = getContentT(locale);
  const pendingShareRef = useRef(false);
  const [refKey, setRefKey] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !isAuthenticated || !userId) return;
    let cancelled = false;
    void fetch("/api/referral/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { referralCode?: string }) => {
        if (!cancelled && d?.referralCode) setRefKey(d.referralCode);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [visible, isAuthenticated, userId]);

  const handleRefillShare = () => {
    const key = refKey ?? userId;
    if (!key) return;
    const shareText = buildShareText(key);
    const shareUrl = buildInviteShareUrl(key);

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: "NEON",
          text: shareText,
          url: shareUrl,
        })
        .then(() => {
          pendingShareRef.current = true;
        })
        .catch(() => {
          // User cancelled or share failed – fallback to WhatsApp
          openWhatsApp(shareText);
          pendingShareRef.current = true;
        });
    } else {
      openWhatsApp(shareText);
      pendingShareRef.current = true;
    }
  };

  function openWhatsApp(text: string) {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  useEffect(() => {
    if (!visible || !userId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (!pendingShareRef.current) return;

      pendingShareRef.current = false;

      fetch("/api/battery/referral-bonus", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.awarded) {
            toast.success("+25% battery!");
            onBatteryRefilled?.();
          } else if (data.error === "cooldown") {
            toast.error(
              `You can claim again in ${Math.ceil((data.remainingMinutes ?? 0) / 60)}h`
            );
          }
        })
        .catch(() => {
          // Restore pending so user can retry on next return
          pendingShareRef.current = true;
        });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [visible, userId, onBatteryRefilled]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="modal-neon relative w-full max-w-md overflow-hidden rounded-2xl border border-red-500/40 p-6 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="mb-4 flex items-center gap-2 text-red-400">
            <span className="text-2xl">🔋</span>
            <h3 className="text-lg font-bold">{t.batteryRechargeModalTitle}</h3>
          </div>
          <p className="mb-6 text-sm leading-relaxed text-white/90">
            {t.batteryDepletedMessage}
          </p>
          <div className="flex flex-col gap-3">
            {userId && (
              <button
                type="button"
                onClick={handleRefillShare}
                className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:from-violet-600 hover:to-fuchsia-600"
              >
                {t.batteryRefillShareBtn}
              </button>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={canAfford ? onQuickCharge : onOpenShop}
                disabled={loading}
                className="flex-1 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-black transition-all hover:bg-amber-400 disabled:opacity-60"
              >
                {loading ? "..." : t.batteryQuickChargeBtn}
              </button>
              {!canAfford && (
                <button
                  type="button"
                  onClick={onOpenShop}
                  className="rounded-xl border border-white/30 px-4 py-3 text-sm font-medium text-white/90"
                >
                  {t.rechargeBtn}
                </button>
              )}
            </div>
            {isAuthenticated && onRechargeWithPayment && (
              <button
                type="button"
                onClick={onRechargeWithPayment}
                className="w-full rounded-xl border border-emerald-500/50 bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-500/30"
              >
                {t.batteryRechargeWithPayment}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
