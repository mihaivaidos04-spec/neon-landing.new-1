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
    <footer className="mt-20 border-t border-white/10 py-12 px-4">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-6">
        <MicroAd format="horizontal" className="overflow-hidden rounded-lg" />
        <p className="max-w-2xl text-center text-xs text-white/60">
          {t.termsSnippet}
        </p>
        <p className="max-w-2xl text-center text-[11px] text-white/40">
          {t.digitalItemsDisclaimer}
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          <Link
            href="/terms"
            className="text-sm font-medium text-white/80 underline decoration-white/40 underline-offset-2 transition hover:text-white hover:decoration-white/70"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="text-sm font-medium text-white/80 underline decoration-white/40 underline-offset-2 transition hover:text-white hover:decoration-white/70"
          >
            Privacy Policy
          </Link>
        </nav>
        <p className="text-center text-xs text-white/40">
          © 2026 NEON Interactive. Toate drepturile rezervate.
        </p>
      </div>
    </footer>
  );
}
