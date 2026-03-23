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
  claimedToday: _claimedToday,
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          const isClaimed = day <= streak;
          const isLoyalDay = day === 7;
          const label =
            isClaimed && isLoyalDay && goldBadge
              ? "★"
              : isClaimed
                ? "✓"
                : String(day);
          return (
            <span
              key={day}
              className="number-plain min-w-[1ch] tabular-nums"
              title={
                isLoyalDay
                  ? t.dailyRewardGoldBadge
                  : isClaimed
                    ? t.dailyRewardClaimed
                    : `${day}/7`
              }
            >
              {label}
            </span>
          );
        })}
      </div>
      {goldBadge && (
        <p className="text-[10px] font-medium text-amber-400/90">
          ★ Loyal {t.dailyRewardGoldBadge} + 50 coins
        </p>
      )}
    </div>
  );
}
