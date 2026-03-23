"use client";

import Link from "next/link";
import LiveIndicator from "@/src/components/LiveIndicator";
import LandingActivityFeed from "@/src/components/landing/LandingActivityFeed";

const FLAGS_ROW = ["🇧🇷", "🇺🇸", "🇯🇵", "🇰🇷", "🇮🇳", "🇲🇽", "🇫🇷", "🇩🇪", "🇮🇩", "🇵🇭"];

type HeroProps = {
  onStartTalking: () => void;
  onSeePricing: () => void;
};

/** Compact hero above the video stage — “Start Talking” scrolls / auth handled by parent. */
export function AiWhisperLandingHero({ onStartTalking, onSeePricing }: HeroProps) {
  return (
    <div className="relative z-[5] w-full shrink-0 border-b border-white/[0.06] bg-gradient-to-b from-[#0c0614] via-[#080510] to-black px-4 py-10 sm:px-6 sm:py-14">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(168, 85, 247, 0.22), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 60%, rgba(236, 72, 153, 0.12), transparent 50%)",
        }}
      />
      <div className="relative mx-auto max-w-5xl">
        <div className="flex flex-col items-center text-center lg:flex-row lg:items-center lg:gap-12 lg:text-left">
          <div className="max-w-xl flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-400/90">NeonLive</p>
            <h2 className="mt-3 font-serif text-3xl font-light leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.35rem]">
              Talk to Anyone. In Any Language. Live.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/65 sm:text-base">
              NeonLive&apos;s AI translates your conversation in real time — so you can connect with anyone in the
              world, in your language.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <button
                type="button"
                onClick={onStartTalking}
                className="min-h-[52px] rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-8 py-3 text-sm font-bold text-white shadow-[0_0_32px_rgba(168,85,247,0.45)] transition hover:brightness-110 active:scale-[0.99]"
              >
                Start Talking Free
              </button>
              <button
                type="button"
                onClick={onSeePricing}
                className="min-h-[52px] rounded-full border border-white/20 bg-white/5 px-8 py-3 text-sm font-semibold text-white/90 transition hover:border-fuchsia-400/40 hover:bg-white/10"
              >
                See Pricing
              </button>
            </div>
            <p className="mt-6 text-xs text-white/45 lg:text-left">
              Join 10,000+ people already talking across languages
            </p>
          </div>
          <div className="relative mt-10 w-full max-w-md flex-1 lg:mt-0">
            <div className="aspect-[4/3] w-full rounded-2xl border border-fuchsia-500/25 bg-black/50 p-4 shadow-[0_0_48px_rgba(168,85,247,0.2)] backdrop-blur-sm">
              <div className="flex h-full gap-2">
                <div className="relative flex-1 overflow-hidden rounded-xl bg-gradient-to-b from-violet-950/80 to-black">
                  <div className="absolute left-2 right-2 top-2 rounded-lg bg-black/55 px-2 py-1 text-[10px] text-fuchsia-100/90 backdrop-blur-md">
                    Hola, ¿cómo estás? → <span className="text-cyan-200">Hello, how are you?</span>
                  </div>
                  <div className="absolute bottom-2 left-1/2 h-16 w-16 -translate-x-1/2 rounded-full bg-gradient-to-br from-fuchsia-500/40 to-violet-600/30 blur-sm" />
                  <span className="absolute bottom-2 right-2 rounded bg-violet-600/90 px-1 py-0.5 text-[8px] font-bold text-white">
                    AI
                  </span>
                </div>
                <div className="relative flex-1 overflow-hidden rounded-xl bg-gradient-to-b from-cyan-950/70 to-black">
                  <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-black/55 px-2 py-1 text-[10px] text-cyan-100/90 backdrop-blur-md">
                    Nice to meet you → <span className="text-fuchsia-200">Encantado de conocerte</span>
                  </div>
                  <span className="absolute bottom-2 right-2 rounded bg-fuchsia-600/90 px-1 py-0.5 text-[8px] font-bold text-white">
                    AI
                  </span>
                </div>
              </div>
              <p className="mt-3 text-center text-[11px] text-white/40">Live video + AI translation bubbles (illustration)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Marketing sections below the video stage (no duplicate bottom CTA). */
export function AiWhisperLandingRest() {
  return (
    <div className="relative z-[5] w-full shrink-0 border-b border-white/[0.06] bg-gradient-to-b from-black via-[#080510] to-[#0c0614] px-4 py-10 sm:px-6 sm:py-14">
      <div className="relative mx-auto max-w-5xl">
        <section className="border-t border-white/[0.06] pt-12">
          <h3 className="text-center text-lg font-semibold text-white sm:text-xl">How it works</h3>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { emoji: "🎥", title: "Connect worldwide", body: "Match with a random stranger anywhere on the planet." },
              { emoji: "🤖", title: "AI Whisper", body: "AI translates everything live, instantly in your language." },
              { emoji: "🌍", title: "No barriers", body: "Talk freely — language is no longer a wall." },
            ].map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 text-center sm:text-left"
              >
                <span className="text-2xl" aria-hidden>
                  {s.emoji}
                </span>
                <h4 className="mt-2 font-semibold text-white">{s.title}</h4>
                <p className="mt-2 text-sm text-white/55">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 text-center">
          <h3 className="text-lg font-semibold text-white">Supports 50+ languages</h3>
          <p className="mt-4 flex flex-wrap justify-center gap-2 text-2xl sm:gap-3" aria-hidden>
            {FLAGS_ROW.map((f) => (
              <span key={f}>{f}</span>
            ))}
            <span className="text-base text-white/50">+ more</span>
          </p>
        </section>

        <section className="mt-14 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8">
          <h3 className="text-center text-lg font-semibold text-white">AI translation included</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { tier: "Free", price: "$0", line: "5 min AI translation / day", highlight: false },
              { tier: "VIP Bronze", price: "$2.99", line: "60 min / day", highlight: false },
              { tier: "VIP Silver", price: "$5.00", line: "3 hours / day", highlight: true },
              { tier: "VIP Gold", price: "$6.99", line: "Unlimited translation", highlight: false },
            ].map((p) => (
              <div
                key={p.tier}
                className={`rounded-xl border p-4 text-left ${
                  p.highlight ? "border-fuchsia-500/50 bg-fuchsia-950/20" : "border-white/10 bg-black/30"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-300/90">{p.tier}</p>
                <p className="mt-1 text-xl font-light text-white">{p.price}</p>
                <p className="mt-2 text-sm text-white/60">{p.line}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-white/40">
            VIP tiers follow your Neon pack purchases ($2.99 / $5 / $6.99). See{" "}
            <Link href="/billing" className="text-violet-400 underline hover:text-violet-300">
              billing
            </Link>
            .
          </p>
        </section>

        <section className="mt-14 space-y-4 text-center">
          <p className="text-sm font-medium text-white/80">Live right now</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <LiveIndicator />
            <span className="text-xs text-white/50">Active users on NeonLive</span>
          </div>
          <p className="pt-2 text-sm font-medium text-white/80">Loved worldwide</p>
          <div className="mx-auto grid max-w-3xl gap-3 text-left sm:grid-cols-3">
            {[
              { flag: "🇯🇵", quote: "“Finally I can practice English live — translations are instant.”" },
              { flag: "🇧🇷", quote: "“Met someone from Korea and we just… talked. Crazy.”" },
              { flag: "🇩🇪", quote: "“The purple vibe + AI subtitles = actually fun.”" },
            ].map((q) => (
              <blockquote
                key={q.flag}
                className="rounded-xl border border-white/10 bg-black/35 p-3 text-[11px] leading-snug text-white/65"
              >
                <span className="mr-1">{q.flag}</span>
                {q.quote}
              </blockquote>
            ))}
          </div>
        </section>
      </div>
      <LandingActivityFeed />
    </div>
  );
}
