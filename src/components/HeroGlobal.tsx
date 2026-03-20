"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import NeonLiveLogo from "./NeonLiveLogo";

const WorldMapLive = dynamic(() => import("./WorldMapLive"), { ssr: false });
const HeroWorldBackdrop = dynamic(() => import("./HeroWorldBackdrop"), { ssr: false });

/** Load world map SVG only when hero enters view — faster mobile LCP */
function LazyHeroWorldBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setShow(true);
      },
      { rootMargin: "100px", threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      {show ? <HeroWorldBackdrop /> : null}
    </div>
  );
}

/** Clean sans for all hero copy — never the script wordmark font */
const HERO_BODY_FONT: CSSProperties = {
  fontFamily: "var(--font-syne), system-ui, sans-serif",
};

export default function HeroGlobal() {
  return (
    <section className="mx-auto mt-16 max-w-4xl text-center sm:mt-24">
      {/* CTA block: world map + logo + headlines (Syne only for text) */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/15 bg-[#06060a]/90 px-5 py-10 shadow-[0_0_80px_rgba(139,92,246,0.08)] sm:px-10 sm:py-12">
        <LazyHeroWorldBackdrop />
        <div className="relative z-10">
          <div className="hero-fade-in mb-1">
            <NeonLiveLogo
              variant="hero"
              showHeartAccent
              className="justify-center"
              as="div"
            />
          </div>
          <p
            className="hero-fade-in hero-delay-1 mx-auto mt-4 max-w-xl text-base font-semibold tracking-tight text-[#faf5eb] sm:text-lg"
            style={HERO_BODY_FONT}
          >
            Connecting Hearts from Tokyo to New York
          </p>
          <p
            className="hero-fade-in hero-delay-2 mx-auto mt-3 max-w-lg text-sm text-[#faf5eb]/65 sm:text-base"
            style={HERO_BODY_FONT}
          >
            Video chat from Jakarta to Riyadh. Free to start. Connect worldwide.
          </p>
        </div>
      </div>

      <div className="hero-fade-in hero-delay-3 mx-auto mt-10 max-w-2xl">
        <p
          className="mb-4 text-xs font-medium uppercase tracking-widest text-violet-400/90"
          style={HERO_BODY_FONT}
        >
          Live now
        </p>
        <WorldMapLive />
      </div>
    </section>
  );
}
