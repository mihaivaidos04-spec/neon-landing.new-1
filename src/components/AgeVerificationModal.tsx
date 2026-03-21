"use client";

import dynamic from "next/dynamic";

/**
 * Persistent 18+ gate for the landing page.
 * Sets cookie `age_verified=true` for 30 days on confirm.
 * “Global Connections · Neon Vibes” hero is shown only here, not on the main feed.
 */

const HeroGlobal = dynamic(() => import("./HeroGlobal"), { ssr: true });

const GOOGLE_EXIT = "https://www.google.com";

type Props = {
  onAccept: () => void;
};

export default function AgeVerificationModal({ onAccept }: Props) {
  return (
    <div
      className="fixed inset-0 z-[210] flex flex-col overflow-y-auto overscroll-y-contain bg-[#030308]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-verify-title"
    >
      <div className="relative z-0 shrink-0 px-2 pt-2 pb-1 sm:px-4 sm:pt-3">
        <HeroGlobal ageGateMode />
      </div>

      <div className="relative z-10 mx-auto mt-1 w-full max-w-md flex-shrink-0 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:mt-2 sm:pb-8">
        <div
          className="rounded-2xl border-2 border-violet-500/50 bg-[#0a0a0f]/95 p-6 shadow-[0_0_60px_rgba(139,92,246,0.35),inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-8"
          style={{
            boxShadow:
              "0 0 0 1px rgba(139, 92, 246, 0.25), 0 0 48px rgba(139, 92, 246, 0.2), 0 0 96px rgba(57, 255, 20, 0.06)",
          }}
        >
          <h2
            id="age-verify-title"
            className="text-center font-serif text-xl font-semibold tracking-tight text-white sm:text-2xl md:text-3xl"
          >
            Age verification
          </h2>
          <p className="mt-3 text-center text-sm leading-relaxed text-white/85 sm:mt-4 sm:text-base">
            Are you 18 or older? This platform contains digital gifting and interactive content.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onAccept}
              className="min-h-[48px] flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:from-violet-500 hover:to-violet-400"
            >
              Yes, I am 18+
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = GOOGLE_EXIT;
              }}
              className="min-h-[48px] flex-1 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/10"
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
