"use client";

import { useState } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";

type Props = { locale: ContentLocale };

export default function FaqSection({ locale }: Props) {
  const t = getContentT(locale);
  const [openId, setOpenId] = useState<string | null>(null);

  const items: { id: string; q: string; a: string }[] = [
    { id: "anon", q: t.faqQ1, a: t.faqA1 },
    { id: "camera", q: t.faqQ2, a: t.faqA2 },
    { id: "expire", q: t.faqQ3, a: t.faqA3 },
  ];

  return (
    <section className="mt-16 sm:mt-20" id="faq">
      <h2 className="mb-6 text-center text-xl font-semibold text-white sm:text-2xl">
        {t.faqTitle}
      </h2>
      <div className="mx-auto max-w-2xl space-y-2">
        {items.map(({ id, q, a }) => (
          <div
            key={id}
            className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenId(openId === id ? null : id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-white/95 transition-colors hover:bg-white/5 sm:px-5 sm:py-4"
            >
              <span>{q}</span>
              <span className="shrink-0 pl-2 text-white/60">
                {openId === id ? "−" : "+"}
              </span>
            </button>
            {openId === id && (
              <div className="border-t border-white/10 px-4 py-3 text-sm text-white/75 sm:px-5 sm:py-4">
                {a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
