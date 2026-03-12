/**
 * User passes – active filter passes from purchases.
 */

import { getSupabase } from "./supabase";
import type { FilterPlanId } from "./checkout-bundles";

/** Plan duration in hours */
const PLAN_DURATION_HOURS: Record<FilterPlanId, number> = {
  location: 1,
  gender: 72, // 3 days
  fullpass: 168, // 7 days
  fullweek: 720, // 30 days
};

export async function addUserPass(
  userId: string,
  planId: FilterPlanId
): Promise<{ success: boolean; error?: string }> {
  const hours = PLAN_DURATION_HOURS[planId] ?? 72;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hours);

  const supabase = getSupabase();
  const { error } = await supabase.from("user_passes").upsert(
    {
      user_id: userId,
      plan_id: planId,
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: "user_id,plan_id" }
  );

  if (error) {
    console.error("[user_passes add]", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
