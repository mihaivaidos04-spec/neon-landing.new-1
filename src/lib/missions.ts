/**
 * Mission of the Day – server-side helpers.
 */

import { getSupabase } from "./supabase";

const MISSION_GOAL = 5;
const STREAK_FOR_NOTIFICATION = 7;
const MISSION_REWARD_COINS = 3;

export type MissionProgress = { count: number; completed: boolean };

export async function getMissionProgress(userId: string): Promise<MissionProgress> {
  const today = new Date().toISOString().slice(0, 10);
  const supabase = getSupabase();
  const { data } = await supabase
    .from("user_missions")
    .select("connection_count, completed")
    .eq("user_id", userId)
    .eq("mission_date", today)
    .single();

  if (!data) return { count: 0, completed: false };
  return {
    count: Math.min((data.connection_count as number) ?? 0, MISSION_GOAL),
    completed: !!data.completed,
  };
}

/**
 * Increments mission count only if connection lasted >= 15 seconds.
 * Uses DB transaction (mission + wallet add) to prevent race conditions.
 */
export async function incrementMission(
  userId: string,
  connectionDurationMs: number
): Promise<{
  count: number;
  completed: boolean;
  justCompleted: boolean;
}> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("mission_increment_with_reward", {
    p_user_id: userId,
    p_connection_duration_ms: Math.floor(connectionDurationMs),
  });

  if (error) {
    console.error("[missions increment]", error);
    return { count: 0, completed: false, justCompleted: false };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    count: (row?.count as number) ?? 0,
    completed: !!row?.completed,
    justCompleted: !!row?.just_completed,
  };
}

/**
 * Returns the current streak (consecutive completed days ending today).
 */
export async function getStreakDays(userId: string): Promise<number> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("user_missions")
    .select("mission_date, completed")
    .eq("user_id", userId)
    .eq("completed", true)
    .order("mission_date", { ascending: false })
    .limit(10);

  if (!data?.length) return 0;
  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  let expectedDate = today;
  for (const row of data) {
    const d = (row.mission_date as string).slice(0, 10);
    if (d !== expectedDate) break;
    streak++;
    expectedDate = new Date(new Date(expectedDate).getTime() - 86400000)
      .toISOString()
      .slice(0, 10);
  }
  return streak;
}

export { STREAK_FOR_NOTIFICATION };
