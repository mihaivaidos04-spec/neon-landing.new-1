/**
 * User rewards – pending digital rewards from purchases.
 * Decrypt flow: pick one pending, apply benefit, mark decrypted.
 */

import { getSupabase } from "./supabase";
import { chargeBattery } from "./battery";

export type RewardType =
  | "chat_time_30min"
  | "golden_avatar_border"
  | "extended_battery"
  | "priority_matching";

export const REWARD_LABELS: Record<RewardType, string> = {
  chat_time_30min: "+30 min Chat Time",
  golden_avatar_border: "Golden Avatar Border",
  extended_battery: "Extended Battery",
  priority_matching: "Unlock Priority Matching",
};

export async function getPendingRewardsCount(userId: string): Promise<number> {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("user_rewards")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "pending");
  if (error) {
    console.error("[rewards getPendingCount]", error);
    return 0;
  }
  return count ?? 0;
}

export async function decryptReward(
  userId: string
): Promise<{ success: boolean; rewardType?: RewardType; label?: string; error?: string }> {
  const supabase = getSupabase();

  const { data: pending, error: fetchErr } = await supabase
    .from("user_rewards")
    .select("id, reward_type")
    .eq("user_id", userId)
    .eq("status", "pending")
    .limit(1)
    .single();

  if (fetchErr || !pending) {
    return { success: false, error: "No pending reward" };
  }

  const rewardType = pending.reward_type as RewardType;
  const label = REWARD_LABELS[rewardType] ?? rewardType;

  switch (rewardType) {
    case "chat_time_30min":
    case "extended_battery":
      await chargeBattery(userId, 30);
      break;
    case "golden_avatar_border":
      await supabase
        .from("user_profiles")
        .upsert(
          {
            user_id: userId,
            avatar_border: "golden",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      break;
    case "priority_matching":
      // Could add to user_profiles or a separate table; for now just mark decrypted
      break;
    default:
      break;
  }

  const { error: updateErr } = await supabase
    .from("user_rewards")
    .update({ status: "decrypted" })
    .eq("id", pending.id);

  if (updateErr) {
    console.error("[rewards decrypt update]", updateErr);
    return { success: false, error: updateErr.message };
  }

  return { success: true, rewardType, label };
}
