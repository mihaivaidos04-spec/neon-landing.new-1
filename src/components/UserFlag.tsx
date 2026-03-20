"use client";

import { useCallback, useState } from "react";
import { FlagIcon, type FlagIconCode } from "react-flag-kit";
import { getCountryDisplayName } from "../lib/country-names";
import { isPlausibleCountryCode } from "../lib/valid-country-code";

export type UserFlagSize = "sm" | "md";

type Props = {
  code: string | null | undefined;
  /** BCP 47 locale for country name tooltip */
  locale?: string;
  size?: UserFlagSize;
  /** Extra classes on the outer wrapper span (alignment in flex rows) */
  className?: string;
};

const DIMS: Record<UserFlagSize, { w: number; h: number }> = {
  sm: { w: 18, h: 12 },
  md: { w: 21, h: 14 },
};

function GlobalGlobe({
  width,
  height,
  title,
}: {
  width: number;
  height: number;
  title?: string;
}) {
  const s = Math.min(width, height) * 0.72;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[2px] bg-white/[0.08] shadow-sm ring-1 ring-white/10"
      style={{ width, height }}
      title={title ?? "Global"}
    >
      <svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        className="text-white/65"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    </span>
  );
}

/**
 * Small flag via react-flag-kit (CDN SVG). Unknown / API miss → globe icon.
 */
export default function UserFlag({
  code,
  locale = "en",
  size = "sm",
  className = "",
}: Props) {
  const [broken, setBroken] = useState(false);
  const onError = useCallback(() => setBroken(true), []);
  const { w, h } = DIMS[size];

  const showGlobe = !code || !isPlausibleCountryCode(code) || broken;
  const label = code && isPlausibleCountryCode(code) ? getCountryDisplayName(code.toUpperCase(), locale) : "Global";

  if (showGlobe) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center align-middle leading-none ${className}`}
        title={label}
      >
        <GlobalGlobe width={w} height={h} title={label} />
      </span>
    );
  }

  const upper = code.toUpperCase() as FlagIconCode;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center align-middle leading-none ${className}`}
      title={label || undefined}
    >
      <FlagIcon
        code={upper}
        width={w}
        height={h}
        alt=""
        aria-hidden
        className="rounded-[2px] object-cover shadow-sm ring-1 ring-white/10"
        onError={onError}
      />
    </span>
  );
}
