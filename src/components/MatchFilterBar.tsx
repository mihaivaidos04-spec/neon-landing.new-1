"use client";

type MatchFilter = "everyone" | "female" | "male" | "verified";

type Props = {
  filter: MatchFilter;
  onFilterChange: (f: MatchFilter) => void;
  /** Neon VIP (User.isVip — Whale Pack): required for Female / Male matching */
  isNeonVip: boolean;
  onOpenUpgradeVip: () => void;
  disabled?: boolean;
  /** Shown on locked gender buttons, e.g. "Neon VIP" */
  vipHint?: string;
};

export default function MatchFilterBar({
  filter,
  onFilterChange,
  isNeonVip,
  onOpenUpgradeVip,
  disabled = false,
  vipHint = "VIP",
}: Props) {
  const filters: { id: MatchFilter; label: string; requiresNeonVip: boolean }[] = [
    { id: "everyone", label: "Everyone", requiresNeonVip: false },
    { id: "female", label: "Female", requiresNeonVip: true },
    { id: "male", label: "Male", requiresNeonVip: true },
    { id: "verified", label: "Verified", requiresNeonVip: false },
  ];

  const handleSelect = (f: MatchFilter) => {
    const item = filters.find((x) => x.id === f);
    if (item?.requiresNeonVip && !isNeonVip) {
      onOpenUpgradeVip();
      return;
    }
    onFilterChange(f);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((f) => {
        const isActive = filter === f.id;
        const locked = f.requiresNeonVip && !isNeonVip;
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
                  ? "border border-amber-500/40 bg-amber-950/35 text-amber-200/90"
                  : "border border-white/20 text-white/80 hover:bg-white/10"
            }`}
            title={locked ? `${vipHint} required for gender preference` : undefined}
          >
            {f.label}
            {locked && <span className="ml-1 text-[10px] opacity-80">({vipHint})</span>}
          </button>
        );
      })}
    </div>
  );
}

export type { MatchFilter };
