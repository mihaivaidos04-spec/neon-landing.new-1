/** Reserved / invalid ISO-like codes we reject for storage */
const BLOCKED = new Set(["XX", "ZZ", "EU", "UN", "XK"]);

/** Loose ISO 3166-1 alpha-2 validation (flag SVG may still be missing for edge codes). */
export function isPlausibleCountryCode(code: string | null | undefined): boolean {
  if (!code || code.length !== 2) return false;
  const u = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(u)) return false;
  if (BLOCKED.has(u)) return false;
  return true;
}
