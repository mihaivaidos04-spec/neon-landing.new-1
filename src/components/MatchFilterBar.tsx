"use client";

type MatchFilter = "everyone" | "female" | "male" | "verified";

const GENDER_FILTER_MIN_COINS = 5;

type Props = {
  filter: MatchFilter;
  onFilterChange: (f: MatchFilter) => void;
  coins: number;
  onOpenShop?: () => void;
  disabled?: boolean;
};

export default function MatchFilterBar({
  filter,
  onFilterChange,
  coins,
  onOpenShop,
  disabled = false,
}: Props) {
  const canUseGenderFilter = coins >= GENDER_FILTER_MIN_COINS;
  const filters: { id: MatchFilter; label: string; needsCoins: boolean }[] = [
    { id: "everyone", label: "Everyone", needsCoins: false },
    { id: "female", label: "Female", needsCoins: true },
    { id: "male", label: "Male", needsCoins: true },
    { id: "verified", label: "Verified", needsCoins: false },
  ];

  const handleSelect = (f: MatchFilter) => {
    const item = filters.find((x) => x.id === f);
    if (item?.needsCoins && !canUseGenderFilter) {
      onOpenShop?.();
      return;
    }
    onFilterChange(f);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((f) => {
        const isActive = filter === f.id;
        const locked = f.needsCoins && !canUseGenderFilter;
        return (
          <button
            key={f.id}
            type="button"
            disabled={disabled}
            onClick={() => handleSelect(f.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              isActive
                ? "bg-[#8b5cf6] text-white ring-1 ring-[#a78bfa]/50"
                : locked
                ? "border border-violet-500/50 bg-violet-950/40 text-violet-300/80"
                : "border border-white/20 text-white/80 hover:bg-white/10"
            }`}
            title={locked ? `${GENDER_FILTER_MIN_COINS} coins required` : undefined}
          >
            {f.label}
            {locked && <span className="ml-1 opacity-70">({GENDER_FILTER_MIN_COINS})</span>}
          </button>
        );
      })}
    </div>
  );
}

export type { MatchFilter };
export { GENDER_FILTER_MIN_COINS };
