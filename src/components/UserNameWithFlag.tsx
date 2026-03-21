"use client";

import LazyUserFlag from "./LazyUserFlag";
import type { UserFlagSize } from "./UserFlag";

type Props = {
  name: string;
  countryCode?: string | null;
  locale?: string;
  flagSize?: UserFlagSize;
  className?: string;
  /** Text span classes */
  nameClassName?: string;
  /** Whale / VIP: gold or electric-blue neon text-shadow */
  neonVipGlow?: "gold" | "blue" | false;
};

/**
 * Username with leading flag; flag has country tooltip. Text baseline-aligned with flag.
 */
export default function UserNameWithFlag({
  name,
  countryCode,
  locale = "en",
  flagSize = "sm",
  className = "",
  nameClassName = "",
  neonVipGlow = false,
}: Props) {
  const vipClass =
    neonVipGlow === "gold"
      ? "neon-vip-name-gold"
      : neonVipGlow === "blue"
        ? "neon-vip-name-blue"
        : "";
  return (
    <span
      className={`inline-flex min-w-0 max-w-full items-center gap-1 sm:gap-1.5 ${className}`}
    >
      <LazyUserFlag
        code={countryCode}
        locale={locale}
        size={flagSize}
        className="translate-y-px sm:translate-y-0"
      />
      <span className={`min-w-0 truncate leading-tight ${vipClass} ${nameClassName}`}>{name}</span>
    </span>
  );
}
