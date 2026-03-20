"use client";

import Image from "next/image";

export type AvatarTier = "whale" | "premium" | "new" | "default";

type Props = {
  src?: string | null;
  alt?: string;
  /** Tier for neon aura: whale = gold, premium = violet, new = pink */
  tier?: AvatarTier;
  /** When true, show pulsing neon ring (premium users) */
  isPremium?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASS = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

const AURA_COLORS: Record<AvatarTier, string> = {
  whale: "rgba(251, 191, 36, 0.9)", // Gold
  premium: "rgba(139, 92, 246, 0.9)", // Violet
  new: "rgba(236, 72, 153, 0.9)", // Pink
  default: "rgba(139, 92, 246, 0.5)", // Subtle violet
};

export default function UserAvatar({
  src,
  alt = "Avatar",
  tier = "default",
  isPremium = false,
  size = "md",
  className = "",
}: Props) {
  const showAura = isPremium;
  const color = AURA_COLORS[tier];

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {showAura && (
        <span
          className="absolute inset-[-3px] rounded-full opacity-80"
          style={{
            boxShadow: `0 0 20px ${color}, 0 0 40px ${color}40`,
            background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
            animation: "pulse-neon 2s ease-in-out infinite",
          }}
          aria-hidden
        />
      )}
      <div
        className={`relative overflow-hidden rounded-full border-2 object-cover ${SIZE_CLASS[size]} ${
          showAura ? "border-white/40" : "border-white/20"
        }`}
        style={
          showAura
            ? { boxShadow: `inset 0 0 12px ${color}40, 0 0 12px ${color}60` }
            : undefined
        }
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 32px, 56px"
            className="object-cover"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzFmMjAzMyIvPjwvc3ZnPg=="
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-violet-900/50 text-white/70"
            style={{ fontSize: size === "sm" ? "0.75rem" : size === "md" ? "1rem" : "1.25rem" }}
          >
            ?
          </div>
        )}
      </div>
    </div>
  );
}
