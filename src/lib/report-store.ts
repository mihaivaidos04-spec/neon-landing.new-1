/**
 * Matching suspension: primary source is `User.systemSuspensionUntil` (Prisma).
 * Optional Supabase `user_profiles.matching_suspended_until` for legacy / studio.
 */

import { prisma } from "./prisma";
import { getSupabase } from "./supabase";

const ONE_HOUR_MS = 60 * 60 * 1000;

/** @deprecated Auto-suspension is handled in POST /api/report; kept for compatibility. */
export async function addReport(_reportedUserId: string): Promise<void> {
  /* no-op — use DB + maybeApplyReportAutoSuspension in API */
}

async function persistSupabaseSuspension(userId: string, untilMs: number): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase.from("user_profiles").upsert(
      {
        user_id: userId,
        matching_suspended_until: new Date(untilMs).toISOString(),
        flagged_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch (e) {
    console.error("[report-store] persist suspension failed:", e);
  }
}

/** 3 distinct reporters in 10 minutes → 1 hour system suspension */
export async function maybeApplyReportAutoSuspension(reportedUserId: string): Promise<void> {
  const windowStart = new Date(Date.now() - 10 * 60 * 1000);
  const reporters = await prisma.report.findMany({
    where: { reportedUserId, createdAt: { gte: windowStart } },
    distinct: ["reporterId"],
    select: { reporterId: true },
  });
  if (reporters.length < 3) return;

  const until = new Date(Date.now() + ONE_HOUR_MS);
  await prisma.user.update({
    where: { id: reportedUserId },
    data: { systemSuspensionUntil: until },
  });
  await persistSupabaseSuspension(reportedUserId, until.getTime());
}

export async function isUserMatchingSuspended(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { systemSuspensionUntil: true },
    });
    if (user?.systemSuspensionUntil && user.systemSuspensionUntil > new Date()) {
      return true;
    }
  } catch (e) {
    console.error("[report-store] prisma suspension check failed:", e);
  }

  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("user_profiles")
      .select("matching_suspended_until")
      .eq("user_id", userId)
      .single();

    const suspendedUntil = data?.matching_suspended_until as string | null | undefined;
    if (!suspendedUntil) return false;
    return new Date(suspendedUntil) > new Date();
  } catch {
    return false;
  }
}
