/**
 * Guest coins and first-login bonus (no-friction identity).
 * - Persist guest coins in localStorage when user is not signed in.
 * - On first sign-in, award +10 coins once (keyed by userId).
 */

const GUEST_COINS_KEY = "neon_guest_coins";
const GUEST_BATTERY_KEY = "neon_guest_battery";
const FIRST_BONUS_PREFIX = "neon_first_bonus_";
const FIRST_LOGIN_BONUS = 10;

export function getStoredGuestCoins(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(GUEST_COINS_KEY);
    if (raw == null) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function setStoredGuestCoins(coins: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_COINS_KEY, String(Math.max(0, coins)));
  } catch {
    // ignore
  }
}

export function clearGuestCoins(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_COINS_KEY);
  } catch {
    // ignore
  }
}

export function getStoredGuestBattery(): number {
  if (typeof window === "undefined") return 100;
  try {
    const raw = localStorage.getItem(GUEST_BATTERY_KEY);
    if (raw == null) return 100;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 100;
  } catch {
    return 100;
  }
}

export function setStoredGuestBattery(battery: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_BATTERY_KEY, String(Math.max(0, Math.min(100, battery))));
  } catch {
    // ignore
  }
}

export function hasReceivedFirstLoginBonus(userId: string): boolean {
  if (typeof window === "undefined" || !userId) return false;
  try {
    return localStorage.getItem(FIRST_BONUS_PREFIX + userId) === "1";
  } catch {
    return false;
  }
}

export function setFirstLoginBonusReceived(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(FIRST_BONUS_PREFIX + userId, "1");
  } catch {
    // ignore
  }
}

export function getFirstLoginBonusAmount(): number {
  return FIRST_LOGIN_BONUS;
}
