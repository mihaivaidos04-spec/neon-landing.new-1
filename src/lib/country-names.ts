/**
 * Localized country name for tooltips (uses Intl — no extra deps).
 */
export function getCountryDisplayName(
  code: string | null | undefined,
  locale = "en"
): string {
  if (!code || code.length !== 2) return "";
  const upper = code.toUpperCase();
  try {
    const dn = new Intl.DisplayNames([locale], { type: "region" });
    return dn.of(upper) ?? upper;
  } catch {
    return upper;
  }
}
