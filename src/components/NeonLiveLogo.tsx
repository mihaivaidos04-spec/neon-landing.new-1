"use client";

import type { ElementType, HTMLAttributes } from "react";

/** Pink + violet neon glow — “love accent” */
const NEON_LOVE_GLOW = {
  color: "#fdf2f8",
  textShadow: `
    0 0 10px rgba(251, 113, 133, 0.95),
    0 0 22px rgba(244, 114, 182, 0.9),
    0 0 38px rgba(192, 132, 252, 0.75),
    0 0 56px rgba(168, 85, 247, 0.5),
    0 0 80px rgba(236, 72, 153, 0.25)
  `,
} as const;

const VARIANT_CLASSES = {
  /** Main nav — balanced with LiveIndicator */
  header: "text-[1.55rem] leading-none sm:text-[1.95rem]",
  /** Landing hero */
  hero: "text-[2.85rem] leading-none sm:text-[4.5rem] md:text-[5.75rem]",
  /** Footer brand row */
  footer: "text-[1.85rem] leading-none sm:text-[2.35rem]",
  /** Small labels (modals) */
  compact: "text-lg leading-none sm:text-xl",
  /** Full-screen verification gate */
  verification: "text-[3.25rem] leading-none sm:text-[4.5rem] md:text-[5rem]",
  /** Immersive login gateway — centered script wordmark */
  gateway: "text-[3rem] leading-none sm:text-[4.25rem] md:text-[5rem]",
} as const;

export type NeonLiveLogoVariant = keyof typeof VARIANT_CLASSES;

export type NeonLiveLogoProps = {
  variant?: NeonLiveLogoVariant;
  className?: string;
  /** Decorative hearts + hover sound (landing header) */
  showHeartAccent?: boolean;
  onHeartInteraction?: () => void;
  as?: ElementType;
  id?: string;
} & Omit<HTMLAttributes<HTMLElement>, "as" | "style">;

/**
 * Wordmark “NeonLive” in script font (Great Vibes via `--font-neonlive-mark` from root layout).
 * All other UI should use Syne / system sans-serif.
 */
export default function NeonLiveLogo({
  variant = "header",
  className = "",
  showHeartAccent = false,
  onHeartInteraction,
  as: Tag = "span",
  id,
  ...rest
}: NeonLiveLogoProps) {
  const sizeClass = VARIANT_CLASSES[variant];

  return (
    <Tag
      id={id}
      className={`inline-flex items-center gap-0.5 sm:gap-1 ${className}`}
      {...rest}
    >
      <span
        className={`neonlive-mark select-none ${sizeClass}`}
        style={{
          fontFamily: "var(--font-neonlive-mark), cursive",
          fontWeight: 400,
          ...NEON_LOVE_GLOW,
        }}
        aria-label="NeonLive"
      >
        NeonLive
      </span>
      {showHeartAccent && (
        <span
          className="logo-hearts group ml-0.5 inline-flex cursor-pointer items-center gap-0.5 sm:ml-1 sm:gap-1"
          onMouseEnter={onHeartInteraction}
          role="presentation"
        >
          <span className="heart-rotate-a relative inline-flex h-[0.85em] w-[0.85em] items-center justify-center sm:h-[0.9em] sm:w-[0.9em]">
            <svg viewBox="0 0 24 24" fill="#f472b6" className="h-full w-full drop-shadow-[0_0_8px_rgba(244,114,182,0.9)]">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </span>
          <span className="heart-rotate-b relative inline-flex h-[0.85em] w-[0.85em] items-center justify-center sm:h-[0.9em] sm:w-[0.9em]">
            <svg viewBox="0 0 24 24" fill="#c084fc" className="h-full w-full drop-shadow-[0_0_8px_rgba(192,132,252,0.85)]">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </span>
        </span>
      )}
    </Tag>
  );
}
