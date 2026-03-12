"use client";

import Link from "next/link";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import MicroAd from "./MicroAd";

type Props = {
  locale?: ContentLocale;
};

export default function Footer({ locale = "ro" }: Props) {
  const t = getContentT(locale);

  return (
    <footer className="mt-20 border-t border-white/10 py-8 px-4">
      <div className="mx-auto mb-6 flex justify-center">
        <MicroAd format="horizontal" className="overflow-hidden rounded-lg" />
      </div>
      <p className="max-w-2xl text-center text-xs text-white/60">
        {t.termsSnippet}
      </p>
      <p className="mt-2 max-w-2xl text-center text-[11px] text-white/40">
        {t.digitalItemsDisclaimer}
      </p>
      <nav className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-white/50">
        <Link href="/privacy" className="underline hover:text-white/70">
          Privacy
        </Link>
        <span aria-hidden className="text-white/30">·</span>
        <Link href="/terms" className="underline hover:text-white/70">
          Terms
        </Link>
      </nav>
      <p className="mt-4 text-center text-xs text-white/40">
        © 2026 NEON Interactive. Toate drepturile rezervate.
      </p>
    </footer>
  );
}
