import { NextResponse } from "next/server";
import { resolveCountryFromRequestHeaders } from "@/src/lib/geo-from-request";
import {
  parseCountryCodeCookie,
  setCountryCodeCookieOnResponse,
} from "@/src/lib/country-cookie";
import { isPlausibleCountryCode } from "@/src/lib/valid-country-code";

export const runtime = "nodejs";

/**
 * Public geo hint for guests: uses edge headers + ipapi/ip-api.
 * Sets `neon_country_code` cookie when a valid code is found.
 */
export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie");
    const existing = parseCountryCodeCookie(cookieHeader);
    if (existing && isPlausibleCountryCode(existing)) {
      return NextResponse.json({ countryCode: existing });
    }

    const code = await resolveCountryFromRequestHeaders(req.headers);
    const normalized =
      code && isPlausibleCountryCode(code) ? code.toUpperCase() : null;

    const res = NextResponse.json({ countryCode: normalized });
    if (normalized) setCountryCodeCookieOnResponse(res, normalized);
    return res;
  } catch (e) {
    console.error("[api/geo/detect]", e);
    return NextResponse.json({ countryCode: null });
  }
}
