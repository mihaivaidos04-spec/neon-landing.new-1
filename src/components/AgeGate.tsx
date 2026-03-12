"use client";

import { useState } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";

type Props = {
  locale?: ContentLocale;
  onConfirm: () => void;
};

export default function AgeGate({ locale = "ro", onConfirm }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const t = getContentT(locale);

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm();
  };

  if (confirmed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 px-4 backdrop-blur-md">
      <div className="max-w-md rounded-2xl border border-[#8b5cf6]/40 bg-zinc-900/90 p-8 text-center">
        <p className="mb-6 text-lg font-medium text-white/95">
          {t.ageGateTitle}
        </p>
        <button
          type="button"
          onClick={handleConfirm}
          className="rounded-full bg-[#8b5cf6] px-8 py-4 font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t.ageGateConfirm}
        </button>
      </div>
    </div>
  );
}
