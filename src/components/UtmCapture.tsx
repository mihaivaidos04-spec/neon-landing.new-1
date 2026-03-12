"use client";

import { useEffect } from "react";
import { parseAttributionFromUrl, storeAttribution } from "../lib/utm-storage";

/**
 * Captures UTM params (utm_source, utm_medium, utm_campaign) and ?ref=USER_ID
 * from the URL on mount and stores them in localStorage.
 * Must run client-side (localStorage).
 */
export default function UtmCapture() {
  useEffect(() => {
    const attribution = parseAttributionFromUrl();
    if (attribution) {
      storeAttribution(attribution);
    }
  }, []);
  return null;
}
