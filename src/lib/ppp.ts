/**
 * Purchasing Power Parity: region-based pricing and currency for global subscription.
 * Runs in background; user only sees the "perfect" price for their country.
 */

export type Region = "A" | "B" | "C";

/** ISO 3166-1 alpha-2 */
const REGION_A: string[] = ["us", "de", "gb", "uk", "fr", "ch", "at", "be", "nl", "se", "no", "ie", "ca", "au", "nz", "jp", "sg"];
const REGION_B: string[] = ["ro", "pl", "tr", "br", "mx", "ar", "cl", "co", "pt", "es", "it", "gr", "hu", "cz", "sk", "bg", "rs", "hr"];

export function getRegionFromCountry(countryCode: string): Region {
  const code = countryCode.toLowerCase().slice(0, 2);
  if (REGION_A.includes(code)) return "A";
  if (REGION_B.includes(code)) return "B";
  return "C";
}

export type CurrencyCode = "USD" | "EUR" | "GBP" | "RON" | "PLN" | "TRY" | "BRL" | "MXN" | "ARS";

export const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  RON: "lei",
  PLN: "zł",
  TRY: "₺",
  BRL: "R$",
  MXN: "$",
  ARS: "$",
};

/** Which currency to show per region (and typical country). */
export function getCurrencyForRegion(region: Region, countryCode?: string): CurrencyCode {
  const code = (countryCode || "").toLowerCase().slice(0, 2);
  if (region === "A") {
    if (code === "gb" || code === "uk") return "GBP";
    if (["de", "fr", "at", "be", "nl", "ie", "it", "es", "pt", "gr"].includes(code)) return "EUR";
    return "USD";
  }
  if (region === "B") {
    if (code === "ro") return "RON";
    if (code === "pl") return "PLN";
    if (code === "tr") return "TRY";
    if (code === "br") return "BRL";
    if (code === "mx") return "MXN";
    if (code === "ar") return "ARS";
    return "EUR";
  }
  return "USD";
}

/** Prices per region: Location 1h, Gender 3d, Full Pass 7d, Full Month 30d. Display = reduced price, old = original. */
export const REGION_PRICES: Record<Region, {
  location: number;
  gender: number;
  fullpass: number;
  fullweek: number;
  oldLocation: number;
  oldGender: number;
  oldFullpass: number;
  oldFullweek: number;
}> = {
  A: { location: 0.99, gender: 4.99, fullpass: 6.99, fullweek: 14.99, oldLocation: 1.65, oldGender: 8.32, oldFullpass: 11.65, oldFullweek: 24.99 },
  B: { location: 0.59, gender: 2.99, fullpass: 4.19, fullweek: 8.99, oldLocation: 0.98, oldGender: 4.98, oldFullpass: 6.98, oldFullweek: 14.99 },
  C: { location: 0.49, gender: 2.49, fullpass: 3.49, fullweek: 5.99, oldLocation: 0.82, oldGender: 4.15, oldFullpass: 5.82, oldFullweek: 9.99 },
};

/** Format price with symbol; psychological rounding (e.g. 4.99 not 5.02). */
export function formatPrice(
  amount: number,
  currency: CurrencyCode,
  options?: { symbolAfter?: boolean }
): string {
  const symbol = CURRENCY_SYMBOL[currency];
  const rounded = Math.round(amount * 100) / 100;
  const str = rounded.toFixed(2);
  if (options?.symbolAfter && (currency === "RON" || currency === "PLN" || currency === "TRY")) {
    return `${str} ${symbol}`;
  }
  if (currency === "USD" || currency === "EUR" || currency === "GBP" || currency === "BRL" || currency === "MXN" || currency === "ARS") {
    return `${symbol}${str}`;
  }
  return `${str} ${symbol}`;
}

/** Get country code from browser (e.g. from locale or future geo API). */
export function getCountryCodeFromBrowser(): string {
  if (typeof navigator === "undefined") return "us";
  const lang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || "en-US";
  const part = lang.split("-")[1];
  return (part || "us").toLowerCase();
}
