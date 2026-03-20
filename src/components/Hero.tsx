"use client";

import NeonLiveLogo from "./NeonLiveLogo";

/** Legacy hero — prefer HeroGlobal on main landing */
export default function Hero() {
  return (
    <section className="mx-auto mt-16 max-w-2xl text-center sm:mt-24">
      <div className="hero-fade-in mb-2">
        <NeonLiveLogo variant="hero" showHeartAccent className="justify-center" as="div" />
      </div>
      <p
        className="hero-fade-in hero-delay-1 mx-auto max-w-lg text-sm text-[#faf5eb]/65 sm:text-base"
        style={{ fontFamily: "var(--font-syne), system-ui" }}
      >
        Video chat aleatoriu. Gratuit să începi.
      </p>
    </section>
  );
}
