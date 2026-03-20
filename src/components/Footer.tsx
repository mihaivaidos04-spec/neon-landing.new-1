import Link from "next/link";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import MicroAd from "./MicroAd";
import NeonLiveLogo from "./NeonLiveLogo";

type Props = {
  locale?: ContentLocale;
};

export default function Footer({ locale = "ro" }: Props) {
  const t = getContentT(locale);
  /**
   * Fixed padding on all routes so SSR === first client paint (no usePathname).
   * pb-28 clears the fixed mobile bottom nav on `/`; lg:pb-12 tightens on desktop.
   */
  return (
    <footer className="mt-20 max-w-[100vw] overflow-x-clip border-t border-white/10 px-4 pt-12 pb-28 lg:pb-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <NeonLiveLogo variant="footer" className="justify-center opacity-95" as="div" />
          <span className="text-[10px] font-medium uppercase tracking-[0.35em] text-violet-400/70">
            Connect · Gift · Live
          </span>
        </div>
        <MicroAd format="horizontal" className="overflow-hidden rounded-lg" />
        <p className="max-w-2xl text-center text-xs text-white/60">
          {t.termsSnippet}
        </p>
        <p className="max-w-2xl text-center text-[11px] text-white/40">
          {t.digitalItemsDisclaimer}
        </p>
        <nav
          aria-label="Legal and policies"
          className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-violet-500/25 bg-violet-950/30 px-4 py-3 sm:gap-3"
        >
          <Link
            href="/terms"
            className="inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white/90 underline decoration-violet-400/60 underline-offset-4 transition hover:bg-white/10 hover:text-white hover:decoration-violet-300"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white/90 underline decoration-violet-400/60 underline-offset-4 transition hover:bg-white/10 hover:text-white hover:decoration-violet-300"
          >
            Privacy
          </Link>
          <Link
            href="/refunds"
            className="inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white/90 underline decoration-violet-400/60 underline-offset-4 transition hover:bg-white/10 hover:text-white hover:decoration-violet-300"
          >
            Refunds
          </Link>
        </nav>
        <p className="text-center text-xs text-white/40">
          © 2026 NEON Interactive. Toate drepturile rezervate.
        </p>
      </div>
    </footer>
  );
}
