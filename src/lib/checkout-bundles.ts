/**
 * Sursă unică de adevăr pentru pachetele de Bănuți – folosită de API și de pagina checkout.
 */

export const CHECKOUT_BUNDLES = [
  {
    id: "micro" as const,
    name: "MICRO",
    coins: 10,
    bonusCoins: 0,
    totalCoins: 10,
    price: 0.99,
    oldPrice: 1.49,
    label: "Quick top-up.",
    badge: "0.99",
    productName: "MICRO · 10 Coins",
    productDescription: "Quick credit top-up for NEON.",
  },
  {
    id: "starter" as const,
    name: "STARTER",
    coins: 100,
    bonusCoins: 0,
    totalCoins: 100,
    price: 0.69,
    oldPrice: 1.15,
    label: "Pentru un prim test de vibe.",
    badge: "-40%",
    productName: "STARTER · 100 Bănuți",
    productDescription: "Pachet de intrare pentru testarea experienței NEON.",
  },
  {
    id: "popular" as const,
    name: "POPULAR",
    coins: 500,
    bonusCoins: 100,
    totalCoins: 600,
    price: 2.49,
    oldPrice: 4.15,
    label: "Cel mai ales de comunitate.",
    badge: "CEL MAI POPULAR",
    productName: "POPULAR · 600 Bănuți (500 + 100 bonus)",
    productDescription: "Cel mai ales de comunitate. Perfect pentru o seară lungă.",
  },
  {
    id: "tycoon" as const,
    name: "TYCOON",
    coins: 1000,
    bonusCoins: 500,
    totalCoins: 1500,
    price: 4.99,
    oldPrice: 8.32,
    label: "Best Value – pentru farmece serioase.",
    badge: "BEST VALUE",
    productName: "TYCOON · 1500 Bănuți (1000 + 500 bonus)",
    productDescription: "Best Value – pentru utilizatori care vor prioritate și cadouri exclusive.",
  },
] as const;

export type BundleId = (typeof CHECKOUT_BUNDLES)[number]["id"];

export function getBundleById(id: BundleId) {
  return CHECKOUT_BUNDLES.find((b) => b.id === id) ?? CHECKOUT_BUNDLES[CHECKOUT_BUNDLES.length - 1];
}

/**
 * Passuri (filtre mashup) – prețuri în USD.
 * Fiecare pass combină mai multe filtre pentru valoare mai mare.
 */
export const FILTER_PLANS = [
  {
    id: "location" as const,
    name: "Location Pass",
    subtitle: "1h · Locație + Țară + Limbă",
    price: 0.99,
    oldPrice: 1.65,
    noAds: false,
    productName: "Location Pass · 1h",
    productDescription: "Filtrează după locație, țară și limbă. 1 oră activă.",
  },
  {
    id: "gender" as const,
    name: "Gender Pass",
    subtitle: "3 zile · Gen + Interese + Vârstă",
    price: 4.99,
    oldPrice: 8.32,
    badge: "POPULAR",
    noAds: true,
    productName: "Gender Pass · 3 zile",
    productDescription: "Filtrează după gen, interese și vârstă. 3 zile active. Fără reclame pe site.",
  },
  {
    id: "fullpass" as const,
    name: "Full Pass",
    subtitle: "7 zile · Toate filtrele",
    price: 6.99,
    oldPrice: 11.65,
    noAds: true,
    productName: "Full Pass · 7 zile",
    productDescription: "Toate filtrele: locație, gen, vârstă, limbă, interese, verificat. 7 zile. Fără reclame pe site.",
  },
  {
    id: "fullweek" as const,
    name: "Full Month",
    subtitle: "30 zile · Toate filtrele",
    price: 14.99,
    oldPrice: 24.99,
    badge: "BEST VALUE",
    noAds: true,
    productName: "Full Month · 30 zile",
    productDescription: "Toate filtrele. 1 lună completă. Fără reclame pe site.",
  },
] as const;

export type FilterPlanId = (typeof FILTER_PLANS)[number]["id"];

export function getFilterPlanById(id: FilterPlanId) {
  return FILTER_PLANS.find((p) => p.id === id) ?? FILTER_PLANS[0];
}

export function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}
