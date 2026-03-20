"use client";

import * as FlagIcons from "country-flag-icons/react/3x2";
import type { ComponentType, SVGAttributes } from "react";
import { getCountryDisplayName } from "../lib/country-names";
import { isPlausibleCountryCode } from "../lib/valid-country-code";

type FlagSvgProps = SVGAttributes<SVGSVGElement> & { title?: string };

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
 * Steag mic (country-flag-icons, SVG). Cod necunoscut / lipsă din pachet → icon glob.
 */
export default function UserFlag({
  code,
  locale = "en",
  size = "sm",
  className = "",
}: Props) {
  const { w, h } = DIMS[size];
  const upper = code?.toUpperCase() ?? "";
  const label =
    code && isPlausibleCountryCode(code) ? getCountryDisplayName(code.toUpperCase(), locale) : "Global";

  const FlagComponent = upper
    ? (FlagIcons as Record<string, ComponentType<FlagSvgProps>>)[upper]
    : undefined;
  const showGlobe = !code || !isPlausibleCountryCode(code) || typeof FlagComponent !== "function";

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

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center align-middle leading-none ${className}`}
      title={label || undefined}
    >
      <FlagComponent
        title={label}
        aria-hidden
        className="rounded-[2px] shadow-sm ring-1 ring-white/10"
        style={{ width: w, height: h, display: "block" }}
      />
    </span>
  );
}
