"use client";

import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";

const DAILY_GOAL = 5;
const DAILY_REWARD_COINS = 5;

type Props = {
  locale: ContentLocale;
  current: number;
  completed: boolean;
  taskType?: "connections" | "messages";
};

export default function DailyQuestPanel({ locale, current, completed, taskType = "connections" }: Props) {
  const t = getContentT(locale);
  const progress = Math.min(current, DAILY_GOAL);
  const goalText = taskType === "messages" ? "Send 5 messages" : t.dailyQuestGoal;

  return (
    <div
      className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4"
      style={{ boxShadow: "0 0 20px rgba(0,0,0,0.2)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#a78bfa]">
            {t.dailyQuestTitle}
          </p>
          <p className="mt-0.5 text-sm text-white/90">
            {goalText}
          </p>
        </div>
        <span className="shrink-0 text-xs font-bold tabular-nums text-[var(--color-text-secondary)]">
          +{DAILY_REWARD_COINS} {t.coinsLabel}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#8b5cf6] transition-all duration-500"
            style={{ width: `${(progress / DAILY_GOAL) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium tabular-nums text-[var(--color-text-secondary)]">
          {completed ? "✓" : `${progress}/${DAILY_GOAL}`}
        </span>
      </div>
    </div>
  );
}

export { DAILY_GOAL, DAILY_REWARD_COINS };
