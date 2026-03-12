"use client";

import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import type { LeaderboardEntry } from "../hooks/useLeaderboard";

type Props = {
  leaderboard: LeaderboardEntry[];
  locale?: ContentLocale;
};

function formatUserId(userId: string): string {
  if (!userId) return "?";
  return userId.length > 10 ? `${userId.slice(0, 8)}…` : userId;
}

export default function LiveLeaderboard({ leaderboard, locale = "ro" }: Props) {
  const t = getContentT(locale);
  if (!leaderboard.length) return null;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="absolute left-3 top-3 z-10 rounded-lg border border-white/20 bg-black/70 px-3 py-2 backdrop-blur-sm">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-white/60">
        {t.leaderboardTitle}
      </p>
      <div className="flex flex-col gap-1">
        {leaderboard.map((entry) => (
          <div
            key={entry.userId}
            className="flex items-center gap-2 text-xs text-white/90"
          >
            <span className="w-4">{medals[entry.rank - 1] ?? `#${entry.rank}`}</span>
            <span className="min-w-0 truncate font-mono">
              {formatUserId(entry.userId)}
            </span>
            <span className="shrink-0 text-[10px] text-amber-400/90">
              {entry.totalSpent}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
