const KEY = "neon_verification_agreed";
const EXPIRY_DAYS = 30;

export function getVerificationExpiry(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { at } = JSON.parse(raw) as { at: number };
    const expiry = at + EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    return expiry > Date.now() ? expiry : null;
  } catch {
    return null;
  }
}

export function isVerificationValid(): boolean {
  return getVerificationExpiry() !== null;
}

export function setVerificationAgreed(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ at: Date.now() }));
  } catch {
    // ignore
  }
}

const TEST_CONSUMED_KEY = "neon_test_consumed";

/** Call when user has consumed the 3 min free test so we hide Test option on refresh. */
export function setTestConsumed(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TEST_CONSUMED_KEY, "1");
  } catch {
    // ignore
  }
}

export function isTestConsumed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(TEST_CONSUMED_KEY) === "1";
  } catch {
    return false;
  }
}
