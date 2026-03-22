"use client";

import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";

type Props = {
  locale: ContentLocale;
  tip: string | null;
  loading: boolean;
  error: string | null;
  onDismiss: () => void;
};

/**
 * Private AI wingman line — only rendered on the local client (never sent to peers).
 */
export default function NeonWhisperOverlay({
  locale,
  tip,
  loading,
  error,
  onDismiss,
}: Props) {
  const t = getContentT(locale);
  if (!tip && !loading && !error) return null;

  return (
    <div
      className="pointer-events-auto absolute bottom-14 left-2 right-2 z-[26] max-lg:bottom-[5.5rem] lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-[min(20rem,calc(100%-1rem))]"
      role="status"
      aria-live="polite"
    >
      <div
        className="relative rounded-xl border border-cyan-400/35 bg-gradient-to-br from-black/90 via-violet-950/90 to-black/90 px-3 py-2.5 shadow-[0_0_24px_rgba(34,211,238,0.15)] backdrop-blur-md"
        style={{ boxShadow: "0 0 20px rgba(168, 85, 247, 0.12), inset 0 1px 0 rgba(255,255,255,0.06)" }}
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300/95">
            {t.neonWhisperTitle}
          </span>
          <span className="rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-200/80">
            {t.neonWhisperBadge}
          </span>
        </div>
        {loading && !tip ? (
          <p className="text-xs italic text-white/55">{t.neonWhisperLoading}</p>
        ) : null}
        {error && !tip ? (
          <p className="text-xs text-amber-200/90">{error === "Unauthorized" ? t.neonWhisperUnavailable : error}</p>
        ) : null}
        {tip ? <p className="text-sm font-medium leading-snug text-white/95">{tip}</p> : null}
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 py-1.5 text-[11px] font-semibold text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          {t.neonWhisperDismiss}
        </button>
      </div>
    </div>
  );
}
