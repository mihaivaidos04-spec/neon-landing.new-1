"use client";

import { useRouter } from "next/navigation";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";

type Props = {
  visible: boolean;
  onClose: () => void;
  locale?: ContentLocale;
};

/**
 * Prompt to buy Whale Pack (sets User.isVip) for gender-preference matching.
 */
export default function UpgradeNeonVipModal({ visible, onClose, locale = "en" }: Props) {
  const router = useRouter();
  const t = getContentT(locale);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="neon-vip-gender-title"
    >
      <div className="card-neon max-w-md rounded-2xl border border-fuchsia-500/40 bg-gradient-to-b from-violet-950/90 to-black/95 p-6 text-center shadow-[0_0_48px_rgba(236,72,153,0.25)]">
        <p
          id="neon-vip-gender-title"
          className="text-lg font-semibold tracking-tight text-fuchsia-100"
        >
          {t.neonVipGenderModalTitle}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/70">{t.neonVipGenderModalBody}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/billing#billing-pack-whale");
            }}
            className="min-h-12 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(236,72,153,0.45)] transition hover:opacity-95 active:scale-[0.98]"
          >
            {t.neonVipGenderModalUpgrade}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-xl border border-white/20 px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10"
          >
            {t.neonVipGenderModalDismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
