"use client";

import { useState, useEffect, useCallback } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import { getBrowserLocale } from "../lib/content-i18n";
import { buildTickerEvent } from "../lib/live-ticker-data";

const FAKE_EVENT_MIN_MS = 30_000;
const FAKE_EVENT_MAX_MS = 60_000;
const MAX_ITEMS = 12;

type Props = {
  locale?: ContentLocale;
};

function LightningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

export default function LiveTicker({ locale }: Props) {
  const [items, setItems] = useState<string[]>(() => []);
  const [mounted, setMounted] = useState(false);
  const resolvedLocale = mounted ? (locale ?? getBrowserLocale()) : "ro";

  // Seed initial items on mount so ticker isn't empty
  useEffect(() => {
    if (!mounted) return;
    const initial = [
      buildTickerEvent(resolvedLocale),
      buildTickerEvent(resolvedLocale),
      buildTickerEvent(resolvedLocale),
    ];
    setItems(initial);
  }, [mounted, resolvedLocale]);

  const addEvent = useCallback(
    (message: string) => {
      setItems((prev) => {
        const next = [message, ...prev].slice(0, MAX_ITEMS);
        return next;
      });
    },
    []
  );

  // Fake events every 30-60 seconds
  useEffect(() => {
    if (!mounted) return;

    const ids: ReturnType<typeof setTimeout>[] = [];

    const scheduleNext = () => {
      const delay = FAKE_EVENT_MIN_MS + Math.random() * (FAKE_EVENT_MAX_MS - FAKE_EVENT_MIN_MS);
      const id = setTimeout(() => {
        addEvent(buildTickerEvent(resolvedLocale));
        scheduleNext();
      }, delay);
      ids.push(id); // push before callback runs
    };

    // Initial event after 2-5 seconds
    const initialDelay = 2000 + Math.random() * 3000;
    const initialId = setTimeout(() => {
      addEvent(buildTickerEvent(resolvedLocale));
      scheduleNext();
    }, initialDelay);
    ids.push(initialId);

    return () => ids.forEach(clearTimeout);
  }, [mounted, resolvedLocale, addEvent]);


  useEffect(() => setMounted(true), []);

  if (!mounted || items.length === 0) return null;

  return (
    <div
      className="live-ticker-bar relative overflow-hidden border-b border-white/5 bg-black/40 py-2 backdrop-blur-sm"
      role="marquee"
      aria-live="polite"
    >
      <div className="live-ticker-track flex animate-ticker-scroll items-center gap-6 whitespace-nowrap">
        {[...items, ...items].map((msg, i) => (
          <div
            key={`${i}-${msg.slice(0, 20)}`}
            className="flex shrink-0 items-center gap-2"
          >
            <LightningIcon className="h-3.5 w-3.5 shrink-0 text-violet-400/90" />
            <span className="text-[11px] font-medium tracking-wide text-white/80 sm:text-xs">
              {msg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
