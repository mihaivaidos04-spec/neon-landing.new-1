"use client";

import { useState, useEffect } from "react";

const MIN_ONLINE = 1420;
const MAX_ONLINE = 1850;

function randomOnline(): number {
  return Math.floor(MIN_ONLINE + Math.random() * (MAX_ONLINE - MIN_ONLINE + 1));
}

export default function LiveIndicator() {
  const [online, setOnline] = useState(() => randomOnline());

  useEffect(() => {
    const id = setInterval(() => {
      setOnline((prev) => {
        const next = randomOnline();
        return Math.abs(next - prev) <= 80 ? next : prev + (next > prev ? 1 : -1) * 40;
      });
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const displayOnline = String(new Intl.NumberFormat("en-US").format(online)).replace(/[^\d,.-]/g, "");

  return (
    <div className="flex items-center gap-2">
      <span
        className="relative flex h-2 w-2 shrink-0"
        aria-hidden
      >
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"
          style={{ animationDuration: "1.5s" }}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
        LIVE
      </span>
      <span className="number-plain text-xs text-[var(--color-text-secondary)]">
        {displayOnline} online
      </span>
    </div>
  );
}
