"use client";

import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";

type Props = {
  visible: boolean;
  locale: ContentLocale;
  onActivate: () => void;
  onRemove: () => void;
  loading?: boolean;
  canAfford?: boolean;
};

export default function BeautyBlurOverlay({
  visible,
  locale,
  onActivate,
  onRemove,
  loading = false,
  canAfford = true,
}: Props) {
  if (!visible) return null;

  const t = getContentT(locale);

  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-label={t.beautyBlurOverlayTitle}
    >
      <p className="text-center text-sm font-medium text-white">
        {t.beautyBlurOverlayTitle}
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={onActivate}
          disabled={loading || !canAfford}
          className="rounded-full bg-[#8b5cf6] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t.beautyBlurActivateBtn}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full border border-white/30 px-6 py-2.5 text-sm font-medium text-white/80"
        >
          {t.beautyBlurRemove}
        </button>
      </div>
    </div>
  );
}
