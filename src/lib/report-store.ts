/**
 * Report store: 3 reports in 1 hour (inappropriate behavior) → flag + 24h matching suspension.
 * In-memory for report counts; DB for persistent suspension.
 */

import { getSupabase } from "./supabase";

const REPORTS_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const SHADOW_BAN_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const THRESHOLD = 3;

const reportsByUser = new Map<string, number[]>();
const shadowBannedUntil = new Map<string, number>();

function pruneOldReports(userId: string): void {
  const reports = reportsByUser.get(userId) ?? [];
  const cutoff = Date.now() - REPORTS_WINDOW_MS;
  const recent = reports.filter((t) => t > cutoff);
  if (recent.length === 0) {
    reportsByUser.delete(userId);
  } else {
    reportsByUser.set(userId, recent);
  }
}

async function persistSuspension(userId: string, until: number): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase.from("user_profiles").upsert(
      {
        user_id: userId,
        matching_suspended_until: new Date(until).toISOString(),
        flagged_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch (e) {
    console.error("[report-store] persist suspension failed:", e);
  }
}

export async function addReport(reportedUserId: string): Promise<void> {
  pruneOldReports(reportedUserId);
  const reports = reportsByUser.get(reportedUserId) ?? [];
  reports.push(Date.now());
  reportsByUser.set(reportedUserId, reports);

  if (reports.length >= THRESHOLD) {
    const until = Date.now() + SHADOW_BAN_DURATION_MS;
    shadowBannedUntil.set(reportedUserId, until);
    await persistSuspension(reportedUserId, until);
  }
}

export function isUserShadowBanned(userId: string): boolean {
  const until = shadowBannedUntil.get(userId);
  if (until && Date.now() < until) return true;
  if (until) shadowBannedUntil.delete(userId);
  return false;
}

export async function isUserMatchingSuspended(userId: string): Promise<boolean> {
  const until = shadowBannedUntil.get(userId);
  if (until && Date.now() < until) return true;

  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("user_profiles")
      .select("matching_suspended_until")
      .eq("user_id", userId)
      .single();

    const suspendedUntil = data?.matching_suspended_until as string | null | undefined;
    if (!suspendedUntil) return false;
    if (new Date(suspendedUntil) > new Date()) return true;
    return false;
  } catch {
    return false;
  }
}
