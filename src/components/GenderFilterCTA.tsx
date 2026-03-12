"use client";

import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectGenderFilter: () => void;
  locale?: ContentLocale;
};

export default function GenderFilterCTA({
  visible,
  onClose,
  onSelectGenderFilter,
  locale = "ro",
}: Props) {
  const t = getContentT(locale);

  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-xl bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-label={t.genderFilterCtaMessage}
    >
      <div className="card-neon mx-4 flex max-w-sm flex-col items-center gap-5 rounded-2xl border border-[#8b5cf6]/40 p-6 text-center">
        <p className="text-lg font-medium text-white">
          {t.genderFilterCtaMessage}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              onSelectGenderFilter();
              onClose();
            }}
            className="min-h-[48px] rounded-full bg-[#8b5cf6] px-6 py-3 text-base font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ boxShadow: "0 0 20px rgba(139, 92, 246, 0.4)" }}
          >
            {t.genderFilterCtaButton}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
          >
            {t.genderFilterCtaDismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
