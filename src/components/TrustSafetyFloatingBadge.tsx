"use client";

import { useSession } from "next-auth/react";

/**
 * Site-wide subtle trust cue — fixed bottom-right; lifts when DM dock is present.
 * Hidden (`display: none` via Tailwind `hidden`); remove `hidden` from root to show again.
 */
export default function TrustSafetyFloatingBadge() {
  const { status } = useSession();
  const docked = status === "authenticated";

  return (
    <div
      className={`hidden pointer-events-none fixed right-3 z-[125] sm:right-4 ${
        docked
          ? "bottom-[max(5.25rem,calc(env(safe-area-inset-bottom)+4.5rem))]"
          : "bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.75rem))]"
      }`}
      role="status"
    >
      <div className="rounded-full border border-white/[0.08] bg-[#07070c]/72 px-2.5 py-1 text-[9px] font-medium leading-snug text-white/45 shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-3 sm:py-1.5 sm:text-[10.5px] sm:text-white/50">
        <span className="select-none">🛡️ Safe &amp; Moderated Platform</span>
      </div>
    </div>
  );
}
