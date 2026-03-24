"use client";

type MatchFilter = "everyone" | "female" | "male" | "verified";

type Props = {
  filter: MatchFilter;
  onFilterChange: (f: MatchFilter) => void;
  disabled?: boolean;
};

export default function MatchFilterBar({
  filter,
  onFilterChange,
  disabled = false,
}: Props) {
  const filters: { id: MatchFilter; label: string }[] = [
    { id: "everyone", label: "Everyone" },
    { id: "female", label: "Female" },
    { id: "male", label: "Male" },
    { id: "verified", label: "Verified" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((f) => {
        const isActive = filter === f.id;
        return (
          <button
            key={f.id}
            type="button"
            disabled={disabled}
            onClick={() => onFilterChange(f.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              isActive
                ? "bg-[#8b5cf6] text-white ring-1 ring-[#a78bfa]/50"
                : "border border-white/20 text-white/80 hover:bg-white/10"
            }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

export type { MatchFilter };
