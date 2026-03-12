"use client";

import { getRankFromCoinsSpent, getCoinsToNextRank, RANK_LABELS, RANK_THRESHOLDS } from "../lib/ranks";
import { formatNumber } from "../lib/format-intl";

type Props = {
  coinsSpent: number;
};

export default function RankProgressionBar({ coinsSpent }: Props) {
  const current = getRankFromCoinsSpent(coinsSpent);
  const nextInfo = getCoinsToNextRank(coinsSpent);

  if (!nextInfo || nextInfo.needed <= 0) {
    return (
      <div className="rounded-lg bg-white/5 px-2 py-1.5 text-[10px] text-white/70">
        Max rank: {RANK_LABELS[current]}
      </div>
    );
  }

  const prevThreshold = RANK_THRESHOLDS[current];
  const nextThreshold = RANK_THRESHOLDS[nextInfo.next];
  const segment = nextThreshold - prevThreshold;
  const progress = segment > 0 ? ((coinsSpent - prevThreshold) / segment) * 100 : 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[10px] text-white/70">
        <span>{formatNumber(nextInfo.needed)} more coins to reach {RANK_LABELS[nextInfo.next]} Rank</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(100, progress)}%`,
            background: "linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)",
          }}
        />
      </div>
    </div>
  );
}
