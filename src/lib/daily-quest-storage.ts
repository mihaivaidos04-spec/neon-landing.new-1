/**
 * Daily quest progress: persist by date so it resets each day.
 */

const KEY_PREFIX = "neon_daily_";

function todayKey(): string {
  const d = new Date();
  return `${KEY_PREFIX}${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getDailyQuestProgress(): { count: number; completed: boolean } {
  if (typeof window === "undefined") return { count: 0, completed: false };
  try {
    const raw = localStorage.getItem(todayKey());
    if (!raw) return { count: 0, completed: false };
    const { count, completed } = JSON.parse(raw) as { count: number; completed: boolean };
    return { count: Math.min(count, 5), completed: !!completed };
  } catch {
    return { count: 0, completed: false };
  }
}

export function setDailyQuestProgress(count: number, completed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(todayKey(), JSON.stringify({ count, completed }));
  } catch {
    // ignore
  }
}
