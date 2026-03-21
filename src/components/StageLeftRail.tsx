"use client";

import { useState, useCallback } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import { DAILY_GOAL } from "./DailyQuestPanel";

type Props = {
  locale: ContentLocale;
  /** Quest progress (0–DAILY_GOAL) */
  questCurrent: number;
  questCompleted: boolean;
  hasRewards: boolean;
  questPanel: React.ReactNode;
  rewardsPanel: React.ReactNode | null;
  /** Gifts & video effects — shown below daily quest when expanded */
  giftShopPanel?: React.ReactNode | null;
};

/** Glowing joystick — future Neon Arcade (non-interactive placeholder). */
function JoystickComingSoonIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M8 18h8a3 3 0 003-3v-1a3 3 0 00-3-3H8a3 3 0 00-3 3v1a3 3 0 003 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 8V5M12 5l1.5 1.5M12 5l-1.5 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Slim collapsible stage rail: icon-only when collapsed, expands for Daily Quest + rewards.
 */
export default function StageLeftRail({
  locale,
  questCurrent,
  questCompleted,
  hasRewards,
  questPanel,
  rewardsPanel,
  giftShopPanel,
}: Props) {
  const t = getContentT(locale);
  const [expanded, setExpanded] = useState(false);
  const progress = Math.min(questCurrent, DAILY_GOAL);
  const pct = questCompleted ? 100 : (progress / DAILY_GOAL) * 100;

  const toggle = useCallback(() => setExpanded((e) => !e), []);

  return (
    <>
      {/* Mobile: horizontal icon strip */}
      <div className="flex w-full shrink-0 items-center gap-2 overflow-x-auto rounded-xl border border-white/10 bg-black/35 px-2 py-2 backdrop-blur-sm xl:hidden">
        <button
          type="button"
          onClick={toggle}
          className="flex min-h-11 min-w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-violet-500/35 bg-violet-950/40 text-[10px] font-bold text-violet-200"
          title={t.dailyQuestTitle}
          aria-expanded={expanded}
          aria-label={t.dailyQuestTitle}
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-violet-500/50">
            <span
              className="absolute inset-0 rounded-full border-2 border-emerald-400/90 border-t-transparent"
              style={{
                transform: `rotate(${questCompleted ? 360 : (pct / 100) * 360 - 90}deg)`,
              }}
              aria-hidden
            />
            <span className="text-sm">{questCompleted ? "✓" : "◎"}</span>
          </span>
          <span className="mt-0.5 tabular-nums text-white/70">
            {questCompleted ? "OK" : `${progress}/${DAILY_GOAL}`}
          </span>
        </button>
        {giftShopPanel && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex min-h-11 min-w-11 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-fuchsia-500/50 bg-gradient-to-br from-fuchsia-950/70 to-violet-950/50 text-lg shadow-[0_0_16px_rgba(236,72,153,0.35)]"
            title="Gifts & effects"
            aria-label="Gift shop"
          >
            🎁
          </button>
        )}
        <div
          className="flex min-h-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-cyan-500/35 bg-black/40 px-2 py-1"
          title={t.gamesComingSoon}
          aria-label={`Games — ${t.gamesComingSoon}`}
          role="status"
        >
          <span className="arcade-joystick-glow flex h-9 w-9 items-center justify-center rounded-md border border-cyan-400/45 bg-gradient-to-br from-cyan-950/80 to-fuchsia-950/50">
            <JoystickComingSoonIcon className="h-[1.35rem] w-[1.35rem] text-cyan-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
          </span>
          <span className="max-w-[4.5rem] text-center text-[8px] font-bold uppercase leading-tight tracking-wide text-cyan-200/90">
            {t.gamesComingSoon}
          </span>
        </div>
        {hasRewards && rewardsPanel && (
          <button
            type="button"
            onClick={toggle}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-950/30 text-lg"
            title="Rewards"
            aria-label="Daily rewards"
          >
            📅
          </button>
        )}
        <span className="text-[10px] text-white/40">{t.dailyQuestTitle}</span>
      </div>

      {expanded && (
        <div className="space-y-3 rounded-xl border border-violet-500/20 bg-[#07070c]/95 p-3 shadow-xl backdrop-blur-xl xl:hidden">
          {questPanel}
          {giftShopPanel}
          {rewardsPanel}
        </div>
      )}

      {/* Desktop: vertical slim rail */}
      <aside
        className="relative z-20 hidden shrink-0 flex-col xl:flex"
        style={{ width: expanded ? "15rem" : "3.5rem" }}
      >
        <div className="flex h-full min-h-[120px] flex-col gap-2 rounded-xl border border-white/10 bg-black/45 py-2 pl-1 pr-1 backdrop-blur-md">
          <button
            type="button"
            onClick={toggle}
            className="mx-auto flex min-h-11 w-11 flex-col items-center justify-center rounded-lg border border-violet-500/35 bg-violet-950/35 text-violet-200 transition-colors hover:bg-violet-900/40"
            title={expanded ? "Collapse" : t.dailyQuestTitle}
            aria-expanded={expanded}
            aria-label={t.dailyQuestTitle}
          >
            <span className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-violet-500/45">
              <span
                className="absolute inset-0 rounded-full border-2 border-emerald-400/80 border-t-transparent"
                style={{
                  transform: `rotate(${questCompleted ? 360 : (pct / 100) * 360 - 90}deg)`,
                }}
                aria-hidden
              />
              <span className="text-xs">{questCompleted ? "✓" : "◎"}</span>
            </span>
            {!expanded && (
              <span className="mt-0.5 text-[8px] font-bold tabular-nums text-white/60">
                {questCompleted ? "✓" : progress}
              </span>
            )}
          </button>

          {giftShopPanel && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border-2 border-fuchsia-500/45 bg-gradient-to-br from-fuchsia-950/60 to-violet-950/40 text-base shadow-[0_0_14px_rgba(236,72,153,0.3)] transition-colors hover:border-fuchsia-400/60"
              title="Gifts & effects"
              aria-label="Gift shop"
            >
              🎁
            </button>
          )}
          <div
            className="mx-auto flex w-11 flex-col items-center gap-1 py-0.5"
            title={t.gamesComingSoon}
            aria-label={`Games — ${t.gamesComingSoon}`}
            role="status"
          >
            <span className="arcade-joystick-glow flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-400/50 bg-gradient-to-br from-cyan-950/75 to-violet-950/45">
              <JoystickComingSoonIcon className="h-5 w-5 text-cyan-200 drop-shadow-[0_0_10px_rgba(34,211,238,0.85)]" />
            </span>
            {expanded && (
              <span className="text-center text-[7px] font-bold uppercase leading-tight tracking-wider text-cyan-200/85">
                {t.gamesComingSoon}
              </span>
            )}
          </div>
          {hasRewards && rewardsPanel && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-950/25 text-base transition-colors hover:bg-amber-900/35"
              title="Rewards"
              aria-label="Daily rewards"
            >
              📅
            </button>
          )}

          <button
            type="button"
            onClick={toggle}
            className="mx-auto mt-auto flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80"
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {expanded ? "«" : "»"}
          </button>
        </div>

        {expanded && (
          <div className="absolute left-full top-0 z-30 ml-2 w-[min(calc(100vw-5rem),22rem)] max-h-[min(calc(100vh-5rem),900px)] space-y-3 overflow-y-auto rounded-xl border border-violet-500/25 bg-[#07070c]/98 p-3 shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-xl [-webkit-overflow-scrolling:touch]">
            {questPanel}
            {giftShopPanel}
            {rewardsPanel}
          </div>
        )}
      </aside>
    </>
  );
}
