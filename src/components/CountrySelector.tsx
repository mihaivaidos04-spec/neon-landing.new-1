"use client";

import { useState, useEffect } from "react";
import { countryCodeToFlagEmoji } from "../lib/country-flags";

const COMMON_COUNTRIES: { code: string; name: string }[] = [
  { code: "SA", name: "Saudi Arabia" },
  { code: "AE", name: "UAE" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "EG", name: "Egypt" },
  { code: "JO", name: "Jordan" },
  { code: "PK", name: "Pakistan" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "MY", name: "Malaysia" },
  { code: "SG", name: "Singapore" },
  { code: "TH", name: "Thailand" },
  { code: "VN", name: "Vietnam" },
  { code: "PH", name: "Philippines" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" },
  { code: "RO", name: "Romania" },
  { code: "GB", name: "UK" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "US", name: "USA" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "TR", name: "Turkey" },
  { code: "NL", name: "Netherlands" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "RU", name: "Russia" },
  { code: "UA", name: "Ukraine" },
];

type Props = {
  userId: string | null;
  /** Compact: icon only */
  compact?: boolean;
};

export default function CountrySelector({ userId, compact = false }: Props) {
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch("/api/me/region")
      .then((r) => r.json())
      .then((d) => setCountryCode(d.countryCode ?? null))
      .catch(() => {});
  }, [userId]);

  const handleSelect = async (code: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/me/region", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode: code }),
      });
      const data = await res.json();
      if (res.ok) {
        setCountryCode(data.countryCode);
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return null;

  if (compact) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-black/50 text-lg leading-none transition-colors hover:bg-white/10"
          title={countryCode ? `Region: ${countryCode}` : "Set your region"}
          aria-label="Set your region"
        >
          {countryCode ? countryCodeToFlagEmoji(countryCode) : "🌐"}
        </button>
        {open && (
          <>
            <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-44 overflow-y-auto rounded-lg border border-white/20 bg-black/95 p-1.5 shadow-xl backdrop-blur-md">
              <p className="mb-1.5 px-1.5 text-[10px] font-medium text-white/60">Set your region</p>
              {COMMON_COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelect(c.code)}
                  disabled={loading}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-white/10 ${
                    countryCode === c.code ? "bg-violet-500/30 text-violet-200" : "text-white/90"
                  }`}
                >
                  <span className="text-base">{countryCodeToFlagEmoji(c.code)}</span>
                  {c.name}
                </button>
              ))}
            </div>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          </>
        )}
      </div>
    );
  }

  return null;
}
