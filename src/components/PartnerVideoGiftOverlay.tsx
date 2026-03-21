"use client";

/**
 * Full-bleed overlay on the partner / main video only (Fire 🔥 & Rocket 🚀).
 * Triggered via Socket.io `theater_gift_overlay` from the matched peer.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import Lottie from "lottie-react";
import { motion, AnimatePresence } from "framer-motion";
import type { TheaterOverlayGiftType } from "@/src/lib/theater-gifts";

const DURATION_MS = 4500;

/** Distinct Lottie moods: fire = warm burst, rocket = launch / celebration */
const LOTTIE_URLS: Record<TheaterOverlayGiftType, string> = {
  fire: "https://assets10.lottiefiles.com/packages/lf20_u4yrau.json",
  rocket: "https://assets9.lottiefiles.com/packages/lf20_2zm4m0ek.json",
};

export type PartnerVideoGiftPayload = {
  giftType: TheaterOverlayGiftType;
  receivedAt: number;
  senderLabel?: string;
  giftLabel?: string;
};

type Props = {
  gift: PartnerVideoGiftPayload | null;
  onComplete: () => void;
};

export default function PartnerVideoGiftOverlay({ gift, onComplete }: Props) {
  const [data, setData] = useState<object | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearT = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!gift) {
      setData(null);
      return;
    }

    let cancelled = false;
    const url = LOTTIE_URLS[gift.giftType];
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });

    timeoutRef.current = setTimeout(() => {
      onComplete();
      clearT();
    }, DURATION_MS);

    return () => {
      cancelled = true;
      clearT();
    };
  }, [gift?.giftType, gift?.receivedAt, onComplete, clearT]);

  const handleLottieComplete = useCallback(() => {
    clearT();
    onComplete();
  }, [onComplete, clearT]);

  if (!gift) return null;

  const emoji = gift.giftType === "fire" ? "🔥" : "🚀";
  const overlayText =
    gift.senderLabel && gift.giftLabel
      ? `${gift.senderLabel} — ${gift.giftLabel}!`
      : gift.giftLabel
        ? `${gift.giftLabel}!`
        : gift.giftType === "fire"
          ? "Fire gift!"
          : "Rocket gift!";

  const tintClass =
    gift.giftType === "fire"
      ? "from-orange-600/35 via-red-600/20 to-transparent"
      : "from-violet-600/35 via-fuchsia-600/20 to-transparent";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[24] flex flex-col items-center justify-center overflow-hidden"
      aria-hidden
    >
      <div
        className={`absolute inset-0 bg-gradient-to-t ${tintClass} mix-blend-screen`}
      />
      <AnimatePresence mode="wait">
        {data ? (
          <motion.div
            key={`lottie-${gift.receivedAt}`}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="h-[85%] w-[85%] max-h-[min(90dvh,720px)] max-w-full">
              <Lottie
                animationData={data}
                loop={gift.giftType === "fire"}
                autoplay
                onComplete={
                  gift.giftType === "rocket" ? handleLottieComplete : undefined
                }
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`emoji-${gift.receivedAt}`}
            className="flex flex-col items-center justify-center gap-2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 1,
              scale: [1, 1.15, 1],
              y: gift.giftType === "rocket" ? [40, -8, 0] : 0,
            }}
            transition={{
              duration: gift.giftType === "rocket" ? 1.2 : 0.8,
              repeat: gift.giftType === "fire" ? Infinity : 0,
              repeatType: "reverse",
            }}
          >
            <span
              className="text-[clamp(4rem,18vw,8rem)] drop-shadow-[0_0_32px_rgba(236,72,153,0.9)]"
              aria-hidden
            >
              {emoji}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-1/2 z-[26] max-w-[92%] -translate-x-1/2 rounded-2xl border border-fuchsia-400/50 bg-black/80 px-4 py-2 text-center shadow-[0_0_40px_rgba(251,146,60,0.35)] backdrop-blur-md"
      >
        <span className="text-lg drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]">
          {emoji}
        </span>
        <p className="mt-1 text-sm font-bold tracking-wide text-fuchsia-50">
          {overlayText}
        </p>
      </motion.div>
    </div>
  );
}
