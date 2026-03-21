"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  /** 0–100 */
  percent: number;
  /** Optional size class */
  className?: string;
  /** Smaller bar for compact header / mobile toolbar */
  compact?: boolean;
};

/** 4 segmente: 25%, 50%, 75%, 100%. La pragurile 75, 50, 25 se stinge vizual câte un segment. */
const SEGMENT_COLORS = {
  high: "rgba(34, 197, 94, 0.9)", // Green Neon
  medium: "rgba(6, 182, 212, 0.9)", // Cyan/Blue Neon
  low: "rgba(251, 191, 36, 0.9)", // Yellow/Orange
  critical: "#ff0040", // Neon Red – ultimul segment (<25%) clipește
} as const;

function getColorAndLitCount(percent: number): { color: string; litCount: number } {
  if (percent > 75) return { color: SEGMENT_COLORS.high, litCount: 4 };
  if (percent > 50) return { color: SEGMENT_COLORS.medium, litCount: 3 };
  if (percent > 25) return { color: SEGMENT_COLORS.low, litCount: 2 };
  if (percent > 0) return { color: SEGMENT_COLORS.critical, litCount: 1 };
  return { color: SEGMENT_COLORS.critical, litCount: 0 };
}

function BatterySegment({
  index,
  isLit,
  color,
  isBlinking,
}: {
  index: number;
  isLit: boolean;
  color: string;
  isBlinking: boolean;
}) {
  return (
    <div className="relative h-full flex-1 overflow-hidden rounded-[2px] first:rounded-l-[3px] last:rounded-r-[3px]">
      <AnimatePresence mode="wait">
        {isLit ? (
          <motion.div
            key="lit"
            className="absolute inset-[1px] rounded-[1px]"
            style={{
              background: color,
              boxShadow: `0 0 8px ${color}, 0 0 16px ${color}40`,
            }}
            initial={{ opacity: 1, scale: 1 }}
            animate={
              isBlinking
                ? {
                    opacity: [1, 0.3, 1],
                    transition: { duration: 0.6, repeat: Infinity },
                  }
                : { opacity: 1 }
            }
            exit={{
              opacity: 0,
              scale: 0.8,
              filter: "brightness(2) blur(1px)",
              transition: {
                duration: 0.25,
                ease: [0.4, 0, 0.2, 1],
              },
            }}
          />
        ) : (
          <motion.div
            key="unlit"
            className="absolute inset-[1px] rounded-[1px] bg-white/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BatteryIndicator({ percent, className = "", compact = false }: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  const { color, litCount } = useMemo(
    () => getColorAndLitCount(clamped),
    [clamped]
  );
  const isBlinking = clamped > 0 && clamped <= 25;

  const bodyClass = compact ? "h-4 w-[4.25rem] rounded-[5px]" : "h-5 w-20 rounded-md";
  const padClass = compact ? "gap-px p-px" : "gap-[2px] p-[3px]";
  const tipClass = compact ? "h-1.5 w-0.5" : "h-2 w-1";

  return (
    <div
      className={`flex shrink-0 items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`Battery ${clamped}%`}
    >
      {/* Battery body - dark glass */}
      <div
        className={`flex overflow-hidden border border-white/20 ${bodyClass}`}
        style={{
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(8px)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div className={`flex h-full flex-1 ${padClass}`}>
          {[0, 1, 2, 3].map((i) => (
            <BatterySegment
              key={i}
              index={i}
              isLit={i < litCount}
              color={color}
              isBlinking={isBlinking && i === 0}
            />
          ))}
        </div>
      </div>
      {/* Battery tip */}
      <div
        className={`rounded-r border-y border-r border-white/20 ${tipClass}`}
        style={{
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(8px)",
        }}
      />
    </div>
  );
}
