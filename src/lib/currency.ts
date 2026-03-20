/**
 * Multi-Currency Display: Convert USD/Coin price to local currencies
 * Fixed exchange rates for SAR, IDR, PHP, VND
 */

export type CurrencyCode = "USD" | "SAR" | "IDR" | "PHP" | "VND";

// Fixed rates vs USD (approximate, update periodically)
const RATES: Record<CurrencyCode, number> = {
  USD: 1,
  SAR: 3.75,
  IDR: 15600,
  PHP: 56,
  VND: 24500,
};

export function convertToLocal(usdAmount: number, currency: CurrencyCode): number {
  const rate = RATES[currency] ?? RATES.USD;
  return Math.round(usdAmount * rate);
}

export function formatLocalPrice(usdAmount: number, currency: CurrencyCode): string {
  const local = convertToLocal(usdAmount, currency);
  switch (currency) {
    case "USD":
      return `$${usdAmount.toFixed(2)}`;
    case "SAR":
      return `${local.toLocaleString()} SAR`;
    case "IDR":
      return `${local.toLocaleString("id-ID")} IDR`;
    case "PHP":
      return `₱${local.toLocaleString()}`;
    case "VND":
      return `${local.toLocaleString("vi-VN")} ₫`;
    default:
      return `$${usdAmount.toFixed(2)}`;
  }
}

/**
 * Format price with local currency approximation.
 * e.g. "$4.99 (approx. 78,000 IDR)"
 */
export function formatPriceWithLocal(
  usdAmount: number,
  localCurrency: CurrencyCode = "IDR"
): string {
  const usdStr = `$${usdAmount.toFixed(2)}`;
  if (localCurrency === "USD") return usdStr;
  const localStr = formatLocalPrice(usdAmount, localCurrency);
  return `${usdStr} (approx. ${localStr})`;
}

/**
 * Format only the local currency part for secondary display.
 * e.g. "approx. 78,000 IDR"
 */
export function formatLocalApprox(usdAmount: number, localCurrency: CurrencyCode = "IDR"): string {
  if (localCurrency === "USD") return "";
  const localStr = formatLocalPrice(usdAmount, localCurrency);
  return `approx. ${localStr}`;
}

/**
 * Coin to USD: 100 coins = 1 USD typically
 */
const COINS_TO_USD = 0.01;

export function coinsToUsd(coins: number): number {
  return coins * COINS_TO_USD;
}

export function formatCoinsWithLocal(coins: number, localCurrency: CurrencyCode = "IDR"): string {
  const usd = coinsToUsd(coins);
  return formatPriceWithLocal(usd, localCurrency);
}
