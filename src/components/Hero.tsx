"use client";

export default function Hero() {
  return (
    <section className="mt-16 text-center sm:mt-24">
      <h1 className="hero-fade-in mb-2 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
        <span
          className="inline-flex items-center gap-2"
          style={{ fontFamily: "var(--font-script), system-ui" }}
        >
          <span className="text-5xl font-light italic sm:text-6xl">Neon</span>
          <span
            className="relative inline-flex h-7 w-7 items-center justify-center rounded-full text-xl text-pink-400 sm:h-8 sm:w-8"
            style={{
              boxShadow: "0 0 18px rgba(244, 114, 182, 0.9)",
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
      <p className="hero-fade-in hero-delay-1 mx-auto max-w-lg text-sm text-white/70 sm:text-base">
        Video chat aleatoriu. Gratuit să începi.
      </p>
    </section>
  );
}
