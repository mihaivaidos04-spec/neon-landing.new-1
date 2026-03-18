"use client";

export default function Hero() {
  return (
    <section className="mx-auto mt-16 max-w-2xl text-center sm:mt-24">
      <h1 className="hero-fade-in mb-2 text-3xl font-medium leading-tight tracking-tight text-[#faf5eb] sm:text-4xl md:text-5xl">
        <span
          className="inline-flex items-center gap-2"
          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
        >
          <span className="text-5xl font-light sm:text-6xl">Neon</span>
          <span
            className="relative inline-flex h-7 w-7 items-center justify-center rounded-full text-xl text-violet-400 sm:h-8 sm:w-8"
            style={{
              boxShadow: "0 0 18px rgba(139, 92, 246, 0.8), 0 0 8px rgba(57, 255, 20, 0.3)",
              animation: "pulse-soft 2.4s ease-in-out infinite",
            }}
          >
            ♥
          </span>
        </span>
        <style jsx>{`
          @keyframes pulse-soft {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.08); opacity: 1; }
            100% { transform: scale(1); opacity: 0.8; }
          }
        `}</style>
      </h1>
      <p className="hero-fade-in hero-delay-1 mx-auto max-w-lg text-sm text-[#faf5eb]/65 sm:text-base" style={{ fontFamily: "var(--font-syne), system-ui" }}>
        Video chat aleatoriu. Gratuit să începi.
      </p>
    </section>
  );
}
