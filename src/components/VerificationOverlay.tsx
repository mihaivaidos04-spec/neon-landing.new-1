"use client";

import { useState, useCallback } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT, getBrowserLocale } from "../lib/content-i18n";
import { setVerificationAgreed } from "../lib/verification-storage";

const GOOGLE_REDIRECT = "https://www.google.com";

type Props = {
  locale?: ContentLocale;
  onVerified: () => void;
};

export default function VerificationOverlay({ locale, onVerified }: Props) {
  const resolvedLocale = locale ?? getBrowserLocale();
  const t = getContentT(resolvedLocale);

  const [age, setAge] = useState(false);
  const [legal, setLegal] = useState(false);
  const [cookies, setCookies] = useState(false);
  const [fading, setFading] = useState(false);

  const allChecked = age && legal && cookies;

  const handleEnter = useCallback(() => {
    if (!allChecked) return;
    setFading(true);
    setVerificationAgreed();
    setTimeout(() => onVerified(), 400);
  }, [allChecked, onVerified]);

  const handleDecline = useCallback(() => {
    if (typeof window !== "undefined") window.location.href = GOOGLE_REDIRECT;
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-black px-4 transition-opacity duration-300 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-title"
    >
      <div className="max-w-md text-center">
        <h1
          id="verification-title"
          className="text-4xl font-bold tracking-tight text-white sm:text-5xl"
          style={{ textShadow: "0 0 40px rgba(139, 92, 246, 0.6)" }}
        >
          NEON
        </h1>
        <p className="mt-4 text-lg text-white/90">{t.verificationWelcome}</p>

        <div className="mt-8 space-y-4 text-left">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={age}
              onChange={(e) => setAge(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/30 bg-white/10 accent-[#8b5cf6]"
            />
            <span className="text-sm text-white/90">{t.verificationAge}</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={legal}
              onChange={(e) => setLegal(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/30 bg-white/10 accent-[#8b5cf6]"
            />
            <span className="text-sm text-white/90">
              {t.verificationLegal}{" "}
              <a
                href="/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8b5cf6] underline hover:opacity-90"
              >
                {t.termsAndConditions}
              </a>{" "}
              {t.verificationLegalAnd}{" "}
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8b5cf6] underline hover:opacity-90"
              >
                {t.gdprPolicy}
              </a>
              .
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={cookies}
              onChange={(e) => setCookies(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/30 bg-white/10 accent-[#8b5cf6]"
            />
            <span className="text-sm text-white/90">{t.verificationCookies}</span>
          </label>
        </div>

        <div className="mt-10 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleEnter}
            disabled={!allChecked}
            className="min-h-[52px] w-full rounded-full bg-[#8b5cf6] px-6 font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90"
            style={{
              boxShadow: allChecked ? "0 0 24px rgba(139, 92, 246, 0.5)" : undefined,
            }}
          >
            {t.verificationEnter}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="min-h-[44px] w-full rounded-full border border-white/20 px-6 text-sm font-medium text-white/70 transition-opacity hover:opacity-90"
          >
            {t.verificationDecline}
          </button>
        </div>
      </div>
    </div>
  );
}
