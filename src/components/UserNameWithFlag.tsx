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
}: Props) {
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
      <span className={`min-w-0 truncate leading-tight ${nameClassName}`}>{name}</span>
    </span>
  );
}
