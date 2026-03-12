/**
 * Quick Report & Shadow Ban logic.
 * - 3 reports in 10 minutes → 30-minute shadow ban
 * - Shadow-banned users are invisible in lists and cannot match
 */

const SHADOW_BAN_REPORTS_THRESHOLD = 3;
const SHADOW_BAN_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const SHADOW_BAN_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const STORAGE_KEY_REPORTS = "neon_reports_received";
const STORAGE_KEY_SHADOW_BAN = "neon_shadow_ban_until";

export function getReportsReceived(): { timestamp: number }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (!raw) return [];
    const arr = JSON.parse(raw) as { timestamp: number }[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function setReportsReceived(reports: { timestamp: number }[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
  } catch {}
}

export function addReportReceived(): void {
  const reports = getReportsReceived();
  reports.push({ timestamp: Date.now() });
  const cutoff = Date.now() - SHADOW_BAN_WINDOW_MS;
  const recent = reports.filter((r) => r.timestamp > cutoff);
  setReportsReceived(recent);

  if (recent.length >= SHADOW_BAN_REPORTS_THRESHOLD) {
    const until = Date.now() + SHADOW_BAN_DURATION_MS;
    try {
      localStorage.setItem(STORAGE_KEY_SHADOW_BAN, String(until));
    } catch {}
  }
}

export function isShadowBanned(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const until = localStorage.getItem(STORAGE_KEY_SHADOW_BAN);
    if (!until) return false;
    const ts = parseInt(until, 10);
    if (Date.now() < ts) return true;
    localStorage.removeItem(STORAGE_KEY_SHADOW_BAN);
    return false;
  } catch {
    return false;
  }
}
