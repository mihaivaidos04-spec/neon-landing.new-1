/**
 * UTM and referral tracking – capture from URL, store in localStorage.
 * When user signs in, attribution is sent to API and saved to user_profiles.
 */

const UTM_STORAGE_KEY = "neon_attribution";

export type StoredAttribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  ref?: string; // ?ref=<referralCode or legacy user id>
  captured_at: string; // ISO timestamp
};

/**
 * Parses current URL for UTM params and ?ref=, returns attribution object.
 */
export function parseAttributionFromUrl(): Partial<StoredAttribution> | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const utm_source = params.get("utm_source") ?? undefined;
  const utm_medium = params.get("utm_medium") ?? undefined;
  const utm_campaign = params.get("utm_campaign") ?? undefined;
  const ref = params.get("ref") ?? undefined;

  if (!utm_source && !utm_medium && !utm_campaign && !ref) return null;

  return {
    ...(utm_source && { utm_source }),
    ...(utm_medium && { utm_medium }),
    ...(utm_campaign && { utm_campaign }),
    ...(ref && { ref }),
    captured_at: new Date().toISOString(),
  };
}

/**
 * Stores attribution in localStorage. Overwrites existing if new params present.
 */
export function storeAttribution(attribution: Partial<StoredAttribution>): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredAttribution();
    const merged: StoredAttribution = {
      ...existing,
      ...attribution,
      captured_at: attribution.captured_at ?? existing?.captured_at ?? new Date().toISOString(),
    };
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
}

/**
 * Returns stored attribution from localStorage.
 */
export function getStoredAttribution(): StoredAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAttribution;
    return parsed?.captured_at ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Clears stored attribution (call after successful save to server).
 */
export function clearStoredAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(UTM_STORAGE_KEY);
  } catch {
    // ignore
  }
}
