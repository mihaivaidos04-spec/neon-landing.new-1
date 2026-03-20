"use client";

import { getT } from "@/src/i18n";
import { useStudioLocale } from "@/src/components/studio/StudioLocaleContext";

type Country = { country: string; name: string; coins: number };

type Props = { countries: Country[]; locale?: "en" | "ar" | "id" };

export default function AudienceMap({ countries, locale: localeProp }: Props) {
  const localeFromContext = useStudioLocale();
  const locale = localeProp ?? localeFromContext;
  const t = getT(locale);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">{t("studio.topCountries")}</h2>
      {countries.length === 0 ? (
        <p className="text-white/50">{t("studio.noAudienceData")}</p>
      ) : (
        <ul className="space-y-3">
          {countries.map((c, i) => (
            <li
              key={c.country}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
            >
              <span className="font-medium text-white">
                #{i + 1} {c.name}
              </span>
              <span className="text-violet-400">{c.coins} coins</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
