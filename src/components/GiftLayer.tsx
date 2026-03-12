"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Lottie from "lottie-react";
import { motion, AnimatePresence } from "framer-motion";
import type { GiftId } from "./GiftsBar";
import { getGiftCost } from "../lib/coins";

/** Cadouri ieftine (heart, rose) → inimi. Cadouri scumpe (coffee, diamond) → artificii. */
const LOTTIE_URLS = {
  hearts: "https://assets9.lottiefiles.com/packages/lf20_2zm4m0ek.json",
  fireworks: "https://assets10.lottiefiles.com/packages/lf20_u4yrau.json",
} as const;

const MAX_DURATION_MS = 5000;

export type ActiveGift = {
  giftId: GiftId;
  receivedAt: number;
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
  }, [gift?.giftId, gift?.receivedAt, onComplete, clearFallbackTimeout]);

  const handleLottieComplete = useCallback(() => {
    clearFallbackTimeout();
    onComplete();
  }, [onComplete, clearFallbackTimeout]);

  if (!gift) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden"
      aria-hidden
    >
      <AnimatePresence mode="wait">
        {animationData && (
          <motion.div
            key={`${gift.giftId}-${gift.receivedAt}`}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="h-full w-full min-h-[200px]">
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
    </div>
  );
}
