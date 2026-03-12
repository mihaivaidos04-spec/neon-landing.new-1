"use client";

import { useState, useEffect } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import {
  getCountryCodeFromBrowser,
  getRegionFromCountry,
  getCurrencyForRegion,
  formatPrice,
  REGION_PRICES,
} from "../lib/ppp";
import PricingCard from "./PricingCard";

export type PlanId = "location" | "gender" | "fullpass" | "fullweek";

type Props = {
  locale?: ContentLocale;
  onSelectPlan: (plan: PlanId) => void;
};

export default function PricingSection({ locale = "ro", onSelectPlan }: Props) {
  const t = getContentT(locale);
  const [prices, setPrices] = useState({
    location: "$0.99",
    gender: "$4.99",
    fullpass: "$6.99",
    fullweek: "$14.99",
    oldLocation: "$1.65",
    oldGender: "$8.32",
    oldFullpass: "$11.65",
    oldFullweek: "$24.99",
  });
  useEffect(() => {
    const country = getCountryCodeFromBrowser();
    const region = getRegionFromCountry(country);
    const curr = getCurrencyForRegion(region, country);
    const r = REGION_PRICES[region];
    const opt = { symbolAfter: curr === "RON" || curr === "PLN" || curr === "TRY" };
    setPrices({
      location: formatPrice(r.location, curr, opt),
      gender: formatPrice(r.gender, curr, opt),
      fullpass: formatPrice(r.fullpass, curr, opt),
      fullweek: formatPrice(r.fullweek, curr, opt),
      oldLocation: formatPrice(r.oldLocation, curr, opt),
      oldGender: formatPrice(r.oldGender, curr, opt),
      oldFullpass: formatPrice(r.oldFullpass, curr, opt),
      oldFullweek: formatPrice(r.oldFullweek, curr, opt),
    });
  }, []);

  return (
    <section id="pricing" className="mt-16 sm:mt-24">
      <h2 className="mb-4 text-center text-base font-medium text-white/90 sm:text-lg">
        Filtre
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <PricingCard
          title={t.filterLocationLabel.toUpperCase()}
          price={prices.location}
          oldPrice={prices.oldLocation}
          subtitle="1h"
          features={["Locație + Țară + Limbă", "1 oră activă"]}
          buttonLabel={`${t.filterLocationLabel} · ${prices.location}`}
          onSelect={() => onSelectPlan("location")}
          delayClass="section-delay-1"
        />
        <PricingCard
          title={t.filterGenderLabel.toUpperCase()}
          price={prices.gender}
          oldPrice={prices.oldGender}
          subtitle="3 zile"
          featured
          featuredBadge="POPULAR"
          features={["Gen + Interese + Vârstă", "3 zile active", "Fără reclame pe site"]}
          buttonLabel={`${t.filterGenderLabel} · ${prices.gender}`}
          onSelect={() => onSelectPlan("gender")}
        />
        <PricingCard
          title={t.fullPassLabel.toUpperCase()}
          price={prices.fullpass}
          oldPrice={prices.oldFullpass}
          subtitle="7 zile"
          features={["Toate filtrele: locație, gen, vârstă, limbă, interese, verificat", "7 zile (o săptămână)", "Fără reclame pe site"]}
          buttonLabel={`${t.fullPassLabel} · ${prices.fullpass}`}
          onSelect={() => onSelectPlan("fullpass")}
          delayClass="section-delay-3"
        />
        <PricingCard
          title="FULL MONTH"
          price={prices.fullweek}
          oldPrice={prices.oldFullweek}
          subtitle="30 zile"
          featured
          featuredBadge="BEST VALUE"
          features={["Toate filtrele", "1 lună completă", "Fără reclame pe site"]}
          buttonLabel={`Full Month · ${prices.fullweek}`}
          onSelect={() => onSelectPlan("fullweek")}
          delayClass="section-delay-4"
        />
      </div>
    </section>
  );
}
