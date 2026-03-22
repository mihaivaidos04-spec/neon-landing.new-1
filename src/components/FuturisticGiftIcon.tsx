"use client";

import { useId } from "react";
import { motion } from "framer-motion";

type Props = {
  className?: string;
  /** Viewport size (square) */
  size?: number;
  /** Soft neon pulse (disable inside dense grids) */
  animate?: boolean;
};

/**
 * Wireframe / hologram gift — replaces flat 🎁 for a more futuristic HUD look.
 */
export default function FuturisticGiftIcon({
  className = "",
  size = 22,
  animate = true,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const g = `fg-${uid}`;

  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${g}-s`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="45%" stopColor="#e879f9" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id={`${g}-f`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#c026d3" stopOpacity="0.06" />
        </linearGradient>
        <filter id={`${g}-blur`} x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="0.65" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Iso base — subtle depth */}
      <path
        d="M5 20.2 12 22.5 19 20.2V9.8L12 7.5 5 9.8v10.4z"
        stroke={`url(#${g}-s)`}
        strokeWidth="0.7"
        strokeLinejoin="round"
        opacity="0.4"
      />
      {/* Box front */}
      <path
        d="M5.5 10h13v8.5h-13V10z"
        stroke={`url(#${g}-s)`}
        strokeWidth="1.15"
        strokeLinejoin="round"
        fill={`url(#${g}-f)`}
        filter={`url(#${g}-blur)`}
      />
      {/* Lid line */}
      <path
        d="M5 10l7-2.8L19 10"
        stroke={`url(#${g}-s)`}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Ribbon */}
      <path d="M12 7.2V18.5" stroke={`url(#${g}-s)`} strokeWidth="0.7" opacity="0.95" />
      <path d="M5.5 14h13" stroke={`url(#${g}-s)`} strokeWidth="0.65" opacity="0.85" />
      {/* Tech bow */}
      <path
        d="M12 7l-1.65-1.35L12 4.3l1.65 1.35L12 7z"
        stroke={`url(#${g}-s)`}
        strokeWidth="0.85"
        strokeLinejoin="round"
        fill={`url(#${g}-f)`}
      />
      {/* Data tick — scan aesthetic */}
      <path
        d="M7 11.5h10M8 16.5h8"
        stroke="#67e8f9"
        strokeWidth="0.3"
        strokeDasharray="1.5 2.5"
        opacity="0.45"
      />
    </svg>
  );

  if (!animate) {
    return <span className="inline-flex shrink-0 items-center justify-center">{svg}</span>;
  }

  return (
    <motion.span
      className="inline-flex shrink-0 items-center justify-center"
      animate={{
        filter: [
          "drop-shadow(0 0 5px rgba(34,211,238,0.45)) drop-shadow(0 0 8px rgba(232,121,249,0.25))",
          "drop-shadow(0 0 12px rgba(232,121,249,0.65)) drop-shadow(0 0 6px rgba(34,211,238,0.4))",
          "drop-shadow(0 0 5px rgba(34,211,238,0.45)) drop-shadow(0 0 8px rgba(232,121,249,0.25))",
        ],
      }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      {svg}
    </motion.span>
  );
}
