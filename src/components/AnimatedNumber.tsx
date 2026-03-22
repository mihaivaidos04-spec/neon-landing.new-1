"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value: number;
  className?: string;
  durationMs?: number;
};

export default function AnimatedNumber({ value, className = "", durationMs = 700 }: Props) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const from = prevValueRef.current;
    const to = value;

    if (from === to) return;

    const startedAt = performance.now();
    const delta = to - from;
    let rafId = 0;

    const step = (ts: number) => {
      const t = Math.min((ts - startedAt) / durationMs, 1);
      const easeOut = 1 - Math.pow(1 - t, 3);
      const next = from + delta * easeOut;
      setDisplayValue(next);

      if (t < 1) {
        rafId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(to);
      }
    };

    rafId = window.requestAnimationFrame(step);
    prevValueRef.current = to;

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [value, durationMs]);

  const formatted = useMemo(() => {
    const rounded = Math.round(displayValue);
    const raw = new Intl.NumberFormat("en-US").format(rounded);
    // Keep only ASCII digits + separators to avoid any keycap/emoji glyph fallback.
    return raw.replace(/[^\d,.-]/g, "");
  }, [displayValue]);

  return <span className={`number-plain ${className}`.trim()}>{formatted}</span>;
}
