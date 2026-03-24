/**
 * User profiles – pass expiry and hasActivePass for subscription-check.
 */

import { getSupabase } from "./supabase";
import type { FilterPlanId } from "./filter-plan-types";

export type PassType = "gender" | "location";

/** Plan duration in hours */
const PLAN_DURATION_HOURS: Record<FilterPlanId, number> = {
  location: 1,
  gender: 72, // 3 days
  fullpass: 168, // 7 days
  fullweek: 720, // 30 days
};

/**
 * Checks if the user has an active pass of the given type.
 * Compares current time with expiry date.
 */
export async function hasActivePass(
  userId: string,
  type: PassType
): Promise<boolean> {
  const supabase = getSupabase();
  const column = type === "gender" ? "gender_pass_expiry" : "location_pass_expiry";
  const { data } = await supabase
    .from("user_profiles")
    .select(column)
    .eq("user_id", userId)
    .single();

  const expiry = (data as Record<string, unknown>)?.[column] as string | null | undefined;
  if (!expiry) return false;
  return new Date(expiry) > new Date();
}

/**
 * Updates the database when a user buys a pass.
 * Adds duration to the appropriate expiry column(s).
 * For Full Pass / Full Month, updates both gender and location.
 */
function addHoursToExpiry(
  currentExpiry: string | null | undefined,
  hours: number
): string {
  const now = new Date();
  const base = currentExpiry ? new Date(currentExpiry) : null;
  const start = base && base > now ? base : now;
  const expires = new Date(start);
  expires.setHours(expires.getHours() + hours);
  return expires.toISOString();
}

export async function updateUserPassExpiry(
  userId: string,
  planId: FilterPlanId
): Promise<{ success: boolean; error?: string }> {
  const hours = PLAN_DURATION_HOURS[planId] ?? 72;
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("user_profiles")
    .select("gender_pass_expiry, location_pass_expiry")
    .eq("user_id", userId)
    .single();

  const updateFields: Record<string, string> = { updated_at: new Date().toISOString() };

  if (planId === "location") {
    updateFields.location_pass_expiry = addHoursToExpiry(
      existing?.location_pass_expiry as string | undefined,
      hours
    );
  } else if (planId === "gender") {
    updateFields.gender_pass_expiry = addHoursToExpiry(
      existing?.gender_pass_expiry as string | undefined,
      hours
    );
  } else {
    updateFields.gender_pass_expiry = addHoursToExpiry(
      existing?.gender_pass_expiry as string | undefined,
      hours
    );
    updateFields.location_pass_expiry = addHoursToExpiry(
      existing?.location_pass_expiry as string | undefined,
      hours
    );
  }

  const { error } = await supabase.from("user_profiles").upsert(
    { user_id: userId, ...updateFields },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[user_profiles update]", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
