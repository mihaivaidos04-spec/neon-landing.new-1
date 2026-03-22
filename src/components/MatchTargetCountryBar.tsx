"use client";

import { useState } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import { COMMON_COUNTRIES } from "../lib/common-countries";
import { countryCodeToFlagEmoji } from "../lib/country-flags";
import { TARGET_COUNTRY_MATCH_COST } from "../lib/coins";

type Props = {
  locale?: ContentLocale;
  value: string | null;
  onChange: (code: string | null) => void;
  coins: number;
  onOpenShop: () => void;
  disabled?: boolean;
};

export default function MatchTargetCountryBar({
  locale = "en",
  value,
  onChange,
  coins,
  onOpenShop,
  disabled = false,
}: Props) {
  const t = getContentT(locale);
  const [open, setOpen] = useState(false);
  const canAfford = coins >= TARGET_COUNTRY_MATCH_COST;
  const needsCoins = value != null && !canAfford;

  return (
    <div className="relative flex flex-col gap-1">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-cyan-200/70">
        {t.matchTargetCountryLabel}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onChange(null);
            setOpen(false);
          }}
          className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all ${
            value == null
              ? "bg-cyan-600/90 text-white ring-1 ring-cyan-400/40"
              : "border border-white/15 text-white/75 hover:bg-white/10"
          }`}
        >
          {t.matchTargetCountryAny}
        </button>
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen((o) => !o)}
            className={`flex min-h-8 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all ${
              value != null
                ? "border-cyan-400/50 bg-cyan-950/40 text-cyan-100"
                : "border-white/15 text-white/80 hover:bg-white/10"
            }`}
          >
            {value ? (
              <>
                <span className="text-sm leading-none">{countryCodeToFlagEmoji(value)}</span>
                <span>{COMMON_COUNTRIES.find((c) => c.code === value)?.name ?? value}</span>
              </>
            ) : (
              <span>{t.matchTargetCountryPick}</span>
            )}
            <span className="text-[9px] text-white/45">▾</span>
          </button>
          {open && (
            <>
              <div className="absolute left-0 top-full z-[60] mt-1 max-h-52 w-[min(16rem,calc(100vw-4rem))] overflow-y-auto rounded-xl border border-white/15 bg-black/95 py-1 shadow-xl backdrop-blur-md">
                {COMMON_COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (!canAfford) {
                        onOpenShop();
                        setOpen(false);
                        return;
                      }
                      onChange(c.code);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[11px] transition-colors hover:bg-white/10 ${
                      value === c.code ? "bg-cyan-600/25 text-cyan-100" : "text-white/90"
                    }`}
                  >
                    <span className="text-base leading-none">{countryCodeToFlagEmoji(c.code)}</span>
                    <span className="flex-1">{c.name}</span>
                    <span className="text-[9px] tabular-nums text-white/40">
                      {TARGET_COUNTRY_MATCH_COST}
                    </span>
                  </button>
                ))}
              </div>
              <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} aria-hidden />
            </>
          )}
        </div>
      </div>
      <p className="text-[9px] leading-tight text-white/40">
        {t.matchTargetCountryHint.replace("{{cost}}", String(TARGET_COUNTRY_MATCH_COST))}
      </p>
      {needsCoins && (
        <p className="text-[9px] font-medium text-amber-300/90">{t.insufficientCoinsCountryMatch}</p>
      )}
    </div>
  );
}
