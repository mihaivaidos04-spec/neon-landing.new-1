"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import { COIN_PACKAGES } from "../lib/coins";
import { formatCurrency } from "../lib/format-intl";

type Props = {
  open: boolean;
  onClose: () => void;
  locale: ContentLocale;
  onSelectPackage?: (packageId: "small" | "medium" | "large") => void;
};

export default function ShopDrawer({ open, onClose, locale, onSelectPackage }: Props) {
  const t = getContentT(locale);

  useEffect(() => {
    if (open) {
      const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
      document.addEventListener("keydown", h);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", h);
        document.body.style.overflow = "";
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  const packageLabels = { small: t.packageSmall, medium: t.packageMedium, large: t.packageLarge };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        aria-hidden
        onClick={onClose}
      />
      <aside
        className="card-neon fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/10 shadow-2xl sm:max-w-sm"
        role="dialog"
        aria-modal="true"
        aria-label={t.shopTitle}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <h2 className="text-lg font-semibold text-white">{t.shopTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <p className="px-4 py-2 text-sm text-white/70">{t.shopSubtitle}</p>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {COIN_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`card-neon rounded-xl border p-4 transition-colors ${
                pkg.featured
                  ? "border-[#8b5cf6]/50"
                  : "border-white/10"
              }`}
            >
              {pkg.featured && (
                <span className="mb-2 inline-block text-[10px] font-semibold uppercase tracking-wider text-[#a78bfa]">
                  {t.shopMostAppreciated}
                </span>
              )}
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-white">
                  {packageLabels[pkg.id]}
                </span>
                <span className="text-2xl font-bold text-white">
                  {pkg?.coins ?? 0} <span className="text-sm font-normal text-white/70">{t.coinsLabel}</span>
                </span>
              </div>
              <p className="mt-1 text-sm text-white/60">{formatCurrency(pkg.priceUsd)}</p>
              <button
                type="button"
                onClick={() => onSelectPackage?.(pkg.id)}
                className="mt-3 w-full rounded-full py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={
                  pkg.featured
                    ? { background: "#8b5cf6", boxShadow: "0 0 20px rgba(139, 92, 246, 0.4)" }
                    : { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }
                }
              >
                {pkg.featured ? "Secure checkout" : "Continue to checkout"}
              </button>
            </div>
          ))}
        </div>
        <div className="space-y-3 border-t border-white/10 px-4 py-4">
          <a
            href="/checkout"
            className="block w-full rounded-full bg-emerald-500/20 py-2.5 text-center text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/30"
          >
            Platform credits · Secure checkout →
          </a>
          <p className="text-center text-xs text-white/50">
            {t.legalByPurchase}{" "}
            <Link href="/terms" className="text-[#8b5cf6] underline hover:opacity-90">
              {t.termsAndConditions}
            </Link>
            ,{" "}
            <Link href="/privacy" className="text-[#8b5cf6] underline hover:opacity-90">
              {t.gdprPolicy}
            </Link>
            ,{" "}
            <Link href="/refunds" className="text-[#8b5cf6] underline hover:opacity-90">
              Refund policy
            </Link>
          </p>
        </div>
      </aside>
    </>
  );
}
