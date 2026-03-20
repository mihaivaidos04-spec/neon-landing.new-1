import type { NextResponse } from "next/server";
import { isPlausibleCountryCode } from "@/src/lib/valid-country-code";

export const COUNTRY_COOKIE_NAME = "neon_country_code";
export const COUNTRY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Parse `neon_country_code` from a raw `Cookie` header (server). */
export function parseCountryCodeCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx === -1) continue;
    const name = p.slice(0, idx).trim();
    if (name !== COUNTRY_COOKIE_NAME) continue;
    let val = p.slice(idx + 1).trim();
    try {
      val = decodeURIComponent(val);
    } catch {
      /* ignore */
    }
    if (isPlausibleCountryCode(val)) return val.toUpperCase();
  }
  return null;
}

export function setCountryCodeCookieOnResponse(res: NextResponse, code: string) {
  if (!isPlausibleCountryCode(code)) return;
  res.cookies.set(COUNTRY_COOKIE_NAME, code, {
    path: "/",
    maxAge: COUNTRY_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
