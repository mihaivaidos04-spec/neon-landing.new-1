"use client";

import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";

type Props = {
  locale: ContentLocale;
  streak: number;
  claimedToday: boolean;
  goldBadge: boolean;
};

export default function DailyRewardCalendar({
  locale,
  streak,
  claimedToday,
  goldBadge,
}: Props) {
  const t = getContentT(locale);

  return (
    <div className="card-neon flex flex-col gap-2 rounded-xl border border-white/10 px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90 sm:text-xs">
          {t.dailyRewardTitle}
        </p>
        <span className="text-[10px] text-white/60 sm:text-xs">
          {t.dailyRewardBattery}
        </span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          const isClaimed = day <= streak;
          const isGoldDay = day === 7;
          return (
            <div
              key={day}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs sm:h-8 sm:w-8 ${
                isClaimed
                  ? isGoldDay && goldBadge
                    ? "bg-amber-500/30 ring-1 ring-amber-400/60"
                    : "bg-emerald-500/20 ring-1 ring-emerald-400/40"
                  : "bg-white/5 ring-1 ring-white/10"
              }`}
              title={
                isGoldDay
                  ? t.dailyRewardGoldBadge
                  : isClaimed
                    ? t.dailyRewardClaimed
                    : `${day}/7`
              }
            >
              {isClaimed ? (
                isGoldDay && goldBadge ? (
                  <span className="text-amber-400">★</span>
                ) : (
                  <span className="text-emerald-400">✓</span>
                )
              ) : (
                <span className="text-white/30">{day}</span>
              )}
            </div>
          );
        })}
      </div>
      {goldBadge && (
        <p className="text-[10px] font-medium text-amber-400/90">
          ★ {t.dailyRewardGoldBadge}
        </p>
      )}
    </div>
  );
}
