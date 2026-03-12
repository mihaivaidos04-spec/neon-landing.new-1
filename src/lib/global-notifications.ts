/**
 * Global notifications – insert events for Realtime broadcast.
 * Clients subscribe to global_notifications INSERT via Supabase Realtime.
 */

import { getSupabase } from "./supabase";

export type GlobalNotificationType = "god_mode" | "streak_7";

export async function insertGlobalNotification(
  type: GlobalNotificationType,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  const { error } = await supabase.from("global_notifications").insert({
    type,
    user_name: userName.slice(0, 64),
  });
  if (error) {
    console.error("[global_notifications insert]", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
