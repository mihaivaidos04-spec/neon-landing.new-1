"use client";

import { motion } from "framer-motion";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import FuturisticGiftIcon from "./FuturisticGiftIcon";

const GIFTS_TITLE: Record<ContentLocale, string> = {
  ro: "Cadouri",
  en: "Gifts",
  de: "Geschenke",
  it: "Regali",
  es: "Regalos",
  fr: "Cadeaux",
  pt: "Presentes",
  nl: "Cadeaus",
  pl: "Prezenty",
  tr: "Hediyeler",
};

/** Showcase-only: illustrative tiers from 1 → 50 coins (theater drawer may differ). */
const SHOWCASE_GIFTS: { emoji: string; coins: number; accent: string }[] = [
  { emoji: "👍", coins: 1, accent: "from-amber-400/70 to-amber-300/25" },
  { emoji: "✨", coins: 5, accent: "from-cyan-400/70 to-cyan-300/25" },
  { emoji: "🌹", coins: 10, accent: "from-rose-400/70 to-rose-300/25" },
  { emoji: "☕", coins: 18, accent: "from-orange-400/70 to-orange-300/25" },
  { emoji: "🎆", coins: 32, accent: "from-violet-400/70 to-violet-300/25" },
  { emoji: "💎", coins: 50, accent: "from-fuchsia-400/70 to-fuchsia-300/25" },
];

type Props = {
  locale: ContentLocale;
  className?: string;
};

export default function TheaterToolboxGiftStrip({ locale, className = "" }: Props) {
  const t = getContentT(locale);
  const title = GIFTS_TITLE[locale];

  return (
    <div
      className={`toolbox-gift-strip overflow-hidden rounded-xl border border-white/10 bg-black/45 p-2 shadow-[0_0_16px_rgba(168,85,247,0.18)] xl:p-1.5 ${className}`}
      aria-label={title}
    >
      <p className="mb-1.5 flex items-center justify-center gap-1.5 text-center text-[8px] font-semibold uppercase tracking-[0.16em] text-fuchsia-200/80">
        <FuturisticGiftIcon size={14} animate={false} />
        {title}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] xl:grid xl:grid-cols-2 xl:gap-x-1 xl:gap-y-1.5 xl:overflow-hidden xl:pb-0">
        {SHOWCASE_GIFTS.map((g, i) => (
          <motion.div
            key={g.emoji + g.coins}
            className="relative flex w-[4.05rem] shrink-0 flex-col items-center justify-center rounded-md border border-white/12 bg-[#0b0b12]/88 px-1 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_10px_rgba(99,102,241,0.16)] xl:min-h-[4.1rem] xl:w-full xl:px-0.5 xl:py-1"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 380, damping: 22 }}
          >
            <span
              aria-hidden
              className={`pointer-events-none absolute left-1.5 right-1.5 top-1 h-px rounded-full bg-gradient-to-r ${g.accent} opacity-80`}
            />
            <motion.span
              className="select-none leading-none"
              aria-hidden
              animate={{
                y: [0, -1.5, 0],
              }}
              transition={{
                duration: 3.2 + i * 0.1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.15,
              }}
            >
              <span className="emoji-ios text-[1.6rem] leading-none">{g.emoji}</span>
            </motion.span>
            <span className="gift-price-text number-plain mt-0.5 text-center text-[8px] leading-tight text-white/62 xl:text-[8px]">
              {g.coins.toLocaleString("en-US")} {t.coinsLabel}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
