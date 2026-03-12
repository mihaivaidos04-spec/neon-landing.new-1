"use client";

import type { RankId } from "../lib/ranks";
import { RANK_LABELS } from "../lib/ranks";

const RANK_COLORS: Record<RankId, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
  platinum: "#e5e4e2",
  neon_god: "#a78bfa",
};

const RANK_ICONS: Record<RankId, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "💎",
  neon_god: "👑",
};

type Props = {
  rank: RankId;
  size?: "sm" | "md";
  showLabel?: boolean;
};

export default function RankBadge({ rank, size = "sm", showLabel = false }: Props) {
  const color = RANK_COLORS[rank];
  const icon = RANK_ICONS[rank];
  const label = RANK_LABELS[rank];
  const sizeClass = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium ${sizeClass}`}
      style={{ backgroundColor: `${color}20`, color, borderColor: `${color}60` }}
      title={label}
    >
      <span>{icon}</span>
      {showLabel && <span>{label}</span>}
    </span>
  );
}
