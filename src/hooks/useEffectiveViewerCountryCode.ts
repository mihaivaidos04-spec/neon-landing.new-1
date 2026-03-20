"use client";

import { useEffect, useMemo, useState } from "react";
import { readCountryCookieFromBrowser } from "@/src/lib/country-cookie-client";
import { isPlausibleCountryCode } from "@/src/lib/valid-country-code";

/**
 * Guests: cookie first, else one-shot `/api/geo/detect` (sets cookie).
 * Authenticated: session country, else cookie fallback while session hydrates.
 */
export function useEffectiveViewerCountryCode(
  status: "loading" | "authenticated" | "unauthenticated",
  sessionCountryCode: string | null | undefined
): string | null {
  const [guestCode, setGuestCode] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "unauthenticated") return;

    const fromCookie = readCountryCookieFromBrowser();
    if (fromCookie) {
      setGuestCode(fromCookie);
      return;
    }

    let cancelled = false;
    fetch("/api/geo/detect", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d: { countryCode?: string | null }) => {
        if (cancelled) return;
        const c = d.countryCode && isPlausibleCountryCode(d.countryCode) ? d.countryCode.toUpperCase() : null;
        setGuestCode(c);
      })
      .catch(() => {
        if (!cancelled) setGuestCode(null);
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  return useMemo(() => {
    if (status === "loading") return null;
    if (status === "authenticated") {
      const fromSession =
        sessionCountryCode && isPlausibleCountryCode(sessionCountryCode)
          ? sessionCountryCode.toUpperCase()
          : null;
      return fromSession ?? readCountryCookieFromBrowser();
    }
    return guestCode;
  }, [status, sessionCountryCode, guestCode]);
}
