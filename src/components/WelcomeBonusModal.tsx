"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { ContentLocale } from "@/src/lib/content-i18n";
import { withConfetti } from "@/src/lib/safe-confetti";
import type { Options } from "canvas-confetti";

type Props = {
  open: boolean;
  onClose: () => void;
  locale?: ContentLocale;
};

function burst(c: (opts?: Options) => Promise<null>, originY: number) {
  const count = 140;
  const defaults: Options = { origin: { y: originY }, zIndex: 3000 };
  void c({
    ...defaults,
    particleCount: Math.floor(count * 0.35),
    spread: 100,
    startVelocity: 35,
    colors: ["#a855f7", "#ec4899", "#22d3ee", "#fbbf24", "#ffffff"],
  });
  void c({
    ...defaults,
    particleCount: Math.floor(count * 0.2),
    spread: 70,
    scalar: 0.9,
    colors: ["#c084fc", "#f472b6"],
  });
}

export default function WelcomeBonusModal({ open, onClose, locale = "en" }: Props) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      firedRef.current = false;
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;

    const t = window.setTimeout(() => {
      withConfetti((c) => {
        burst(c, 0.72);
        window.setTimeout(() => burst(c, 0.55), 220);
      });
    }, 80);

    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  const ro = locale === "ro";

  return (
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center bg-black/88 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-bonus-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-fuchsia-500/40 bg-gradient-to-b from-[#1a0a24] via-[#0c0614] to-black p-6 shadow-[0_0_48px_rgba(236,72,153,0.35)]">
        <h2 id="welcome-bonus-title" className="text-center text-xl font-bold text-white sm:text-2xl">
          {ro ? "Bine ai venit pe NeonLive! 🎉" : "Welcome to NeonLive! 🎉"}
        </h2>
        <p className="mt-4 text-center text-base font-semibold text-fuchsia-200/95">
          {ro
            ? "Ai primit 50 de monede GRATUITE ca să începi!"
            : "You received 50 FREE coins to get started!"}
        </p>
        <p className="mt-2 text-center text-sm text-white/55">
          {ro
            ? "Folosește-le pentru cadouri, efecte și multe altele."
            : "Use them for gifts, effects, and more."}
        </p>

        <Link
          href="/profile"
          onClick={onClose}
          className="mt-6 block rounded-xl border border-amber-400/45 bg-gradient-to-r from-amber-950/60 to-violet-950/50 px-4 py-3 text-center text-sm font-semibold text-amber-100 transition hover:border-amber-300/60 hover:brightness-110"
        >
          <span className="block text-[11px] font-bold uppercase tracking-wide text-amber-300/90">
            {ro ? "Ofertă limitată" : "Limited time"}
          </span>
          <span className="mt-1 block">
            {ro
              ? "Primul tău upgrade VIP are 50% reducere — doar azi"
              : "Your first VIP upgrade is 50% off — today only"}
          </span>
          <span className="mt-1 block text-xs font-normal text-white/50">
            {ro ? "Vezi pachetele pe pagina de prețuri →" : "View packs on the pricing page →"}
          </span>
        </Link>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(168,85,247,0.45)] transition hover:opacity-95"
        >
          {ro ? "Super, hai să începem!" : "Awesome, let’s go!"}
        </button>
      </div>
    </div>
  );
}
