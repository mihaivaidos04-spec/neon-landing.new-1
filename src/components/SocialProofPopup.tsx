"use client";

import { useEffect, useRef, useState } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import {
  formatSocialProofPurchaseLine,
  pickRandomSocialProofPurchaseEvent,
} from "../lib/social-proof-data";

const VISIBLE_MS = 4000;
const FADE_MS = 400;
const GAP_MIN_MS = 8000;
const GAP_MAX_MS = 12000;

export default function SocialProofPopup({ locale = "ro" }: { locale?: ContentLocale }) {
  const [line, setLine] = useState<string | null>(null);
  const [fading, setFading] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    let cancelled = false;

    const push = (id: ReturnType<typeof setTimeout>) => {
      timeouts.push(id);
    };
    const clearAll = () => {
      timeouts.forEach(clearTimeout);
      timeouts.length = 0;
    };

    function showOne() {
      if (cancelled) return;
      const e = pickRandomSocialProofPurchaseEvent();
      setLine(formatSocialProofPurchaseLine(locale, e));
      setFading(false);

      push(
        setTimeout(() => {
          if (cancelled) return;
          setFading(true);
        }, VISIBLE_MS)
      );

      push(
        setTimeout(() => {
          if (cancelled) return;
          setLine(null);
          setFading(false);
          const gap = GAP_MIN_MS + Math.random() * (GAP_MAX_MS - GAP_MIN_MS);
          push(
            setTimeout(() => {
              if (!cancelled) showOne();
            }, gap)
          );
        }, VISIBLE_MS + FADE_MS)
      );
    }

    const firstDelay = GAP_MIN_MS + Math.random() * (GAP_MAX_MS - GAP_MIN_MS);
    push(
      setTimeout(() => {
        if (!cancelled) showOne();
      }, firstDelay)
    );

    return () => {
      cancelled = true;
      clearAll();
    };
  }, [locale]);

  if (!line) return null;

  return (
    <div
      className={`card-neon notification-popup fixed bottom-4 left-4 z-50 max-w-[min(280px,calc(100vw-2rem))] rounded-lg border border-white/10 bg-black/85 px-3 py-2.5 text-white/90 shadow-lg backdrop-blur-sm transition-opacity duration-300 ease-out sm:bottom-6 sm:left-6 ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-live="polite"
    >
      <p className="text-sm leading-snug text-white/95">{line}</p>
    </div>
  );
}
