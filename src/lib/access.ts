/**
 * checkAccess – verifies if user can perform a filtered skip.
 * Requires either an active Pass OR minimum balance of 5 coins.
 * When hasActivePass is true, user can use filters without deducting coins.
 */

import { getSupabase } from "./supabase";
import { FILTER_SKIP_COST } from "./coins";
import { hasActivePass as checkHasActivePass, type PassType } from "./user-profiles";

export type FilterType = "gender" | "location" | "all";

export type CheckAccessResult =
  | { allowed: true; viaPass: boolean; viaCoins?: boolean }
  | { allowed: false; error: string };

export async function checkAccess(
  userId: string,
  filterType: FilterType
): Promise<CheckAccessResult> {
  // 1. Check for active pass (user_profiles expiry columns)
  if (filterType === "gender" || filterType === "all") {
    const hasGender = await checkHasActivePass(userId, "gender");
    if (hasGender) return { allowed: true, viaPass: true };
  }
  if (filterType === "location" || filterType === "all") {
    const hasLocation = await checkHasActivePass(userId, "location");
    if (hasLocation) return { allowed: true, viaPass: true };
  }

  // 2. Check wallet balance for coin-based skip
  const supabase = getSupabase();
  const { data: wallet } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();

  const balance = (wallet?.balance as number) ?? 0;
  if (balance >= FILTER_SKIP_COST) {
    return { allowed: true, viaPass: false, viaCoins: true };
  }

  return {
    allowed: false,
    error: "need_pass_or_coins",
  };
}
