/**
 * Spending Tiers – Whale status when user spends >$20 in session.
 * $20 ≈ 2000 coins (at ~$0.01/coin from bundles).
 */

const SESSION_SPEND_KEY = "neon_session_spent";
const WHALE_THRESHOLD_COINS = 2000;

export function getSessionSpent(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = sessionStorage.getItem(SESSION_SPEND_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function addSessionSpend(amount: number): void {
  if (typeof window === "undefined" || amount <= 0) return;
  try {
    const current = getSessionSpent();
    sessionStorage.setItem(SESSION_SPEND_KEY, String(current + amount));
  } catch {
    // ignore
  }
}

export function isWhale(): boolean {
  return getSessionSpent() >= WHALE_THRESHOLD_COINS;
}
