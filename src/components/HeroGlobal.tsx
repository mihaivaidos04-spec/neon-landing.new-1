"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

const WorldMapLive = dynamic(() => import("./WorldMapLive"), { ssr: false });

/** Night city — Unsplash (remotePatterns in next.config) */
const HERO_BG =
  "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&q=80&w=2400";

const HERO_BODY_FONT: CSSProperties = {
  fontFamily: "var(--font-syne), system-ui, sans-serif",
};

type Props = {
  onStartConnecting?: () => void;
  isAuthenticated?: boolean;
  onGoToStage?: () => void;
  /** When true (18+ gate only): show branding without START CTA — user confirms age below */
  ageGateMode?: boolean;
};

export default function HeroGlobal({
  onStartConnecting,
  isAuthenticated = false,
  onGoToStage,
  ageGateMode = false,
}: Props) {
  return (
    <section
      className={`landing-hero-section relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-fuchsia-500/20 shadow-[0_0_60px_rgba(236,72,153,0.15)] ${ageGateMode ? "mt-0 mb-2" : "mt-6 sm:mt-10"}`}
    >
      <div className="pointer-events-none absolute inset-0">
        <Image
          src={HERO_BG}
          alt=""
          fill
          priority
          className="object-cover brightness-[0.35]"
          sizes="(max-width: 1200px) 100vw, 1200px"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#030308] via-[#050508]/85 to-transparent"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-violet-950/50 via-transparent to-fuchsia-950/40"
          aria-hidden
        />
      </div>

      <div className="relative z-10 flex min-h-[min(72vw,28rem)] flex-col items-center justify-center px-4 py-14 text-center sm:min-h-[22rem] sm:py-20 md:py-24">
        <h1
          className="hero-neon-h1 max-w-4xl text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          style={HERO_BODY_FONT}
        >
          Global Connections. Neon Vibes.
        </h1>

        <p
          className="mx-auto mt-4 max-w-lg text-sm text-white/70 sm:text-base"
          style={HERO_BODY_FONT}
        >
          Video chat worldwide. Real people, neon nights, gifts that hit different.
        </p>

        {!ageGateMode && (
          <button
            type="button"
            onClick={() => {
              if (isAuthenticated) {
                onGoToStage?.();
              } else {
                onStartConnecting?.();
              }
            }}
            className="hero-cta-connect mt-10 min-h-[3.75rem] scale-110 rounded-2xl px-10 py-4 text-base font-bold text-white transition-transform hover:scale-[1.14] active:scale-105 sm:min-h-[3.5rem] sm:text-lg"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #c026d3 55%, #db2777 100%)",
              boxShadow: "0 0 40px rgba(168, 85, 247, 0.45)",
              fontFamily: "var(--font-syne), system-ui, sans-serif",
            }}
          >
            {isAuthenticated ? "Jump into the stage" : "Start Connecting Now"}
          </button>
        )}
      </div>

      <div
        className="relative z-10 border-t border-white/10 bg-black/40 px-3 py-2.5 backdrop-blur-md sm:px-6"
        style={HERO_BODY_FONT}
      >
        <p className="text-center text-[10px] font-medium uppercase tracking-[0.12em] text-fuchsia-200/80 sm:text-xs sm:tracking-[0.18em]">
          <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:gap-x-4">
            <span>
              <span className="live-dot mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />2,405
              Users Online
            </span>
            <span className="hidden text-white/25 sm:inline">|</span>
            <span>142 Countries</span>
            <span className="hidden text-white/25 sm:inline">|</span>
            <span>10,000+ Gifts Sent Today</span>
          </span>
        </p>
      </div>

      <div className="relative z-10 border-t border-white/5 bg-black/20 px-4 pb-10 pt-8">
        <p
          className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-violet-400/90"
          style={HERO_BODY_FONT}
        >
          Live now
        </p>
        <WorldMapLive />
      </div>
    </section>
  );
}
