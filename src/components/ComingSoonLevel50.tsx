"use client";

import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";

type Props = { locale: ContentLocale };

export default function ComingSoonLevel50({ locale }: Props) {
  const t = getContentT(locale);

  return (
    <section className="mt-16 sm:mt-20">
      <div
        className="mx-auto max-w-2xl rounded-2xl border border-[#8b5cf6]/30 bg-gradient-to-b from-[#8b5cf6]/15 to-transparent p-6 text-center sm:p-8"
        style={{ boxShadow: "0 0 40px rgba(139, 92, 246, 0.15)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a78bfa]">
          {t.level50Badge}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
          {t.level50Title}
        </h2>
        <p className="mt-3 text-sm text-white/80">
          {t.level50Desc}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/70">
          <span className="text-lg">👁</span>
          {t.level50Unlock}
        </div>
      </div>
    </section>
  );
}
