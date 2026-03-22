"use client";

import { useEffect, useState, useRef, useCallback, useMemo, type CSSProperties } from "react";
import Lottie from "lottie-react";
import { motion, AnimatePresence } from "framer-motion";
import type { GiftId } from "./GiftsBar";
import { getGiftCost } from "../lib/coins";
import GiftAssetIcon from "./GiftAssetIcon";

/** Cadouri ieftine (heart, rose) → inimi. Cadouri scumpe (coffee, diamond) → artificii. */
const LOTTIE_URLS = {
  hearts: "https://assets9.lottiefiles.com/packages/lf20_2zm4m0ek.json",
  fireworks: "https://assets10.lottiefiles.com/packages/lf20_u4yrau.json",
} as const;

const MAX_DURATION_MS = 5000;

function createLikeHeartParticles(seed: number) {
  return Array.from({ length: 18 }, (_, idx) => ({
    id: `${seed}_${idx}`,
    left: 12 + Math.random() * 76,
    delay: Math.random() * 360,
    drift: (Math.random() - 0.5) * 76,
    rotate: (Math.random() - 0.5) * 38,
    size: 0.85 + Math.random() * 0.6,
  }));
}

export type ActiveGift = {
  giftId: GiftId;
  receivedAt: number;
  /** e.g. viewer display name */
  senderLabel?: string;
  /** Localized gift name e.g. "Rose" */
  giftLabel?: string;
};

type Props = {
  gift: ActiveGift | null;
  onComplete: () => void;
};

function isExpensiveGift(giftId: GiftId): boolean {
  const cost = getGiftCost(giftId);
  return cost >= 10;
}

export default function GiftLayer({ gift, onComplete }: Props) {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const timeoutRef = useRef<number | ReturnType<typeof setTimeout> | null>(null);

  const clearFallbackTimeout = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!gift) return;

    const type = isExpensiveGift(gift.giftId) ? "fireworks" : "hearts";

    let cancelled = false;
    fetch(LOTTIE_URLS[type])
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch(() => {
        if (!cancelled) {
          clearFallbackTimeout();
          onComplete();
        }
      });

    timeoutRef.current = window.setTimeout(() => {
      onComplete();
      clearFallbackTimeout();
    }, MAX_DURATION_MS);

    return () => {
      cancelled = true;
      clearFallbackTimeout();
    };
  }, [gift, onComplete, clearFallbackTimeout]);

  const handleLottieComplete = useCallback(() => {
    clearFallbackTimeout();
    onComplete();
  }, [onComplete, clearFallbackTimeout]);

  const likeHearts = useMemo(
    () =>
      gift && gift.giftId === "heart"
        ? createLikeHeartParticles(gift.receivedAt)
        : [],
    [gift]
  );
  if (!gift) return null;

  const iconId = gift.giftId;
  const overlayText =
    gift.senderLabel && gift.giftLabel
      ? `${gift.senderLabel} sent a ${gift.giftLabel}!`
      : gift.giftLabel
        ? `${gift.giftLabel}!`
        : "Gift!";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden"
      aria-hidden
    >
      <AnimatePresence mode="wait">
        {animationData && (
          <motion.div
            key={`${gift.giftId}-${gift.receivedAt}`}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-fuchsia-500/10 via-violet-500/10 to-cyan-400/5 backdrop-blur-[1px]" />
            <div className="h-full w-full min-h-[200px] opacity-85">
              <Lottie
                animationData={animationData}
                loop={false}
                autoplay
                onComplete={handleLottieComplete}
                style={{ width: "100%", height: "100%", maxHeight: "100%" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {gift.giftId === "heart" &&
        likeHearts.map((particle) => (
          <span
            key={particle.id}
            className="gift-like-heart-particle"
            style={
              {
                left: `${particle.left}%`,
                animationDelay: `${particle.delay}ms`,
                fontSize: `${particle.size}rem`,
                "--heart-drift": `${particle.drift}px`,
                "--heart-rot": `${particle.rotate}deg`,
              } as CSSProperties
            }
            aria-hidden
          >
            <GiftAssetIcon id="heart" size={22} />
          </span>
        ))}
      <motion.div
        key={`banner-${gift.receivedAt}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="absolute bottom-6 left-1/2 z-30 flex max-w-[90%] -translate-x-1/2 items-center gap-2 rounded-2xl border border-fuchsia-400/40 bg-black/60 px-4 py-2.5 shadow-[0_0_32px_rgba(236,72,153,0.35)] backdrop-blur-lg"
      >
        <span className="gift-emoji-future-wrap shrink-0">
          <GiftAssetIcon id={iconId} size={26} />
        </span>
        <span className="text-center text-sm font-bold text-fuchsia-100 premium-number-glow">{overlayText}</span>
      </motion.div>
    </div>
  );
}
