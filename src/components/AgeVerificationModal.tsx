"use client";

import NeonLiveLogo from "./NeonLiveLogo";

/**
 * Persistent 18+ gate for the landing page.
 * Sets cookie `age_verified=true` for 30 days on confirm.
 */

const GOOGLE_EXIT = "https://www.google.com";

type Props = {
  onAccept: () => void;
};

export default function AgeVerificationModal({ onAccept }: Props) {
  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-verify-title"
    >
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        aria-hidden
      />

      <div
        className="relative w-full max-w-md rounded-2xl border-2 border-violet-500/50 bg-[#0a0a0f]/95 p-8 shadow-[0_0_60px_rgba(139,92,246,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]"
        style={{
          boxShadow:
            "0 0 0 1px rgba(139, 92, 246, 0.25), 0 0 48px rgba(139, 92, 246, 0.2), 0 0 96px rgba(57, 255, 20, 0.06)",
        }}
      >
        <div className="flex justify-center">
          <NeonLiveLogo variant="compact" className="justify-center scale-110" as="div" />
        </div>
        <h2
          id="age-verify-title"
          className="mt-4 text-center font-serif text-2xl font-semibold tracking-tight text-white sm:text-3xl"
        >
          Age verification
        </h2>
        <p className="mt-4 text-center text-base leading-relaxed text-white/85">
          Are you 18 or older? This platform contains digital gifting and interactive content.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
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
  );
}
