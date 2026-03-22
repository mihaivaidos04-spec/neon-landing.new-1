"use client";

import { useEffect, useRef } from "react";

type MicroAdProps = {
  /** Slot ID for Google AdSense (e.g. "1234567890") */
  slotId?: string;
  /** Format: "horizontal" (320x50) | "rectangle" (300x250) | "auto" */
  format?: "horizontal" | "rectangle" | "auto";
  /** Optional className for wrapper */
  className?: string;
};

export default function MicroAd({ slotId, format = "horizontal", className = "" }: MicroAdProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
    const slot = slotId || process.env.NEXT_PUBLIC_ADSENSE_SLOT;

    if (client && slot && typeof window !== "undefined") {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch {
        // ignore
      }
    }
  }, [slotId]);

  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const slot = slotId || process.env.NEXT_PUBLIC_ADSENSE_SLOT;
  const hasAdSense = Boolean(client && slot);

  const sizeLabel =
    format === "horizontal"
      ? `${(320).toLocaleString("en-US")}x${(50).toLocaleString("en-US")}`
      : format === "rectangle"
        ? `${(300).toLocaleString("en-US")}x${(250).toLocaleString("en-US")}`
        : "auto";

  if (hasAdSense) {
    return (
      <div className={`micro-ad ${className}`} ref={ref}>
        <ins
          className="adsbygoogle"
          style={{ display: "block", textAlign: "center", minHeight: format === "horizontal" ? 50 : format === "rectangle" ? 250 : 90 }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={format === "auto"}
        />
      </div>
    );
  }

  // Placeholder pentru dezvoltare / demo
  const size = format === "horizontal" ? "h-[50px] w-full max-w-[320px]" : format === "rectangle" ? "h-[250px] w-full max-w-[300px]" : "h-[90px] w-full max-w-[320px]";
  return (
    <div
      className={`micro-ad-placeholder flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] ${size} ${className}`}
    >
      <span className="number-plain text-[10px] text-white/30">
        {sizeLabel} · Ad
      </span>
    </div>
  );
}
