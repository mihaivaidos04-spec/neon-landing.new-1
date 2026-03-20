"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getStoredCookieConsent,
  setStoredCookieConsent,
  type CookieConsentChoice,
} from "@/src/lib/cookie-consent-storage";

/**
 * GDPR-style notice for cookies / payments / analytics.
 * Choice stored in localStorage (non-HttpOnly).
 */
export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [customize, setCustomize] = useState(false);

  useEffect(() => {
    setVisible(getStoredCookieConsent() === null);
  }, []);

  function accept(choice: CookieConsentChoice) {
    setStoredCookieConsent(choice);
    setVisible(false);
    setCustomize(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[190] px-4 pb-4 pt-2 sm:px-6"
      role="region"
      aria-label="Cookie consent"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-violet-500/35 bg-[#0c0c12]/95 px-5 py-4 shadow-[0_-8px_40px_rgba(0,0,0,0.5)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm leading-relaxed text-white/85">
          We use cookies to enhance your experience and process payments safely. By continuing, you agree
          to our{" "}
          <Link href="/privacy" className="font-medium text-violet-400 underline hover:text-violet-300">
            Privacy Policy
          </Link>
          .
        </p>

        <div className="flex flex-shrink-0 flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => accept("all")}
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              Accept All
            </button>
            <button
              type="button"
              onClick={() => setCustomize((c) => !c)}
              className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:border-violet-500/50 hover:bg-white/5"
            >
              Customize
            </button>
          </div>
          {customize && (
            <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/75">
              <p className="font-medium text-white/90">Choose storage preference</p>
              <button
                type="button"
                onClick={() => accept("essential")}
                className="text-left underline decoration-violet-500/50 hover:text-violet-300"
              >
                Essential only — required for login, security, and checkout
              </button>
              <button
                type="button"
                onClick={() => accept("all")}
                className="text-left underline decoration-violet-500/50 hover:text-violet-300"
              >
                All — includes experience &amp; analytics cookies where used
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
