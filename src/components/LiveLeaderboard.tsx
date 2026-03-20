"use client";

import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import LazyUserFlag from "./LazyUserFlag";
import type { LeaderboardEntry } from "../hooks/useLeaderboard";

type Props = {
  leaderboard: LeaderboardEntry[];
  locale?: ContentLocale;
  currentUserId?: string | null;
  onGoGhost?: () => void;
};

function formatUserId(userId: string, isBlurred: boolean): string {
  if (isBlurred) return "••••••••";
  if (!userId) return "?";
  return userId.length > 10 ? `${userId.slice(0, 8)}…` : userId;
}

export default function LiveLeaderboard({ leaderboard, locale = "ro", currentUserId, onGoGhost }: Props) {
  const t = getContentT(locale);
  if (!leaderboard.length) return null;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="absolute left-3 top-3 z-10 rounded-lg border border-white/20 bg-black/70 px-3 py-2 backdrop-blur-sm">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-white/60">
        {t.leaderboardTitle}
      </p>
      <div className="flex flex-col gap-1">
        {leaderboard.map((entry) => {
          const isBlurred = !entry.isGhostModeEnabled;
          const isCurrentUser = currentUserId && entry.userId === currentUserId;
          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-2 text-xs ${isBlurred ? "opacity-80" : "text-white/90"}`}
            >
              <span className="w-4">{medals[entry.rank - 1] ?? `#${entry.rank}`}</span>
              {entry.countryCode && (
                <LazyUserFlag code={entry.countryCode} locale={locale} size="sm" className="shrink-0" />
              )}
              <span className="min-w-0 truncate font-mono">
                {formatUserId(entry.userId, isBlurred)}
              </span>
              <span className="shrink-0 text-[10px] text-violet-400/90">
                {entry.totalSpent}
              </span>
              {isCurrentUser && isBlurred && onGoGhost && (
                <button
                  type="button"
                  onClick={onGoGhost}
                  className="ml-1 shrink-0 rounded bg-violet-500/80 px-1.5 py-0.5 text-[9px] font-semibold text-white hover:bg-violet-500"
                >
                  Go Ghost
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
