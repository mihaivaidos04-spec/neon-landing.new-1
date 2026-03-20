"use client";

import { COUNTRY_COOKIE_NAME } from "@/src/lib/country-cookie";
import { isPlausibleCountryCode } from "@/src/lib/valid-country-code";

/** Read `neon_country_code` from `document.cookie` (client only). */
export function readCountryCookieFromBrowser(): string | null {
  if (typeof document === "undefined") return null;
  const escaped = COUNTRY_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  if (!m?.[1]) return null;
  let v = m[1].trim();
  try {
    v = decodeURIComponent(v);
  } catch {
    /* ignore */
  }
  return isPlausibleCountryCode(v) ? v.toUpperCase() : null;
}
