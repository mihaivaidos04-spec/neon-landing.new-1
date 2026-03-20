export const COOKIE_CONSENT_STORAGE_KEY = "neonlive_cookie_consent";

export type CookieConsentChoice = "all" | "essential";

export function getStoredCookieConsent(): CookieConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (raw === "all" || raw === "essential") return raw;
    return null;
  } catch {
    return null;
  }
}

export function setStoredCookieConsent(choice: CookieConsentChoice): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, choice);
  } catch {
    /* ignore */
  }
}
