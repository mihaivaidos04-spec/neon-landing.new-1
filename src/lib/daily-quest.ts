/**
 * Daily Quest – random task (5 connections or 5 messages), 5 coins reward.
 */

import { getSupabase } from "./supabase";

const MISSION_GOAL = 5;
const MISSION_REWARD_COINS = 5;

export type DailyQuestProgress = {
  count: number;
  completed: boolean;
  taskType: "connections" | "messages";
};

export async function getDailyQuestProgress(userId: string): Promise<DailyQuestProgress> {
  const today = new Date().toISOString().slice(0, 10);
  const supabase = getSupabase();
  const { data } = await supabase
    .from("daily_quests")
    .select("current_value, completed, task_type")
    .eq("user_id", userId)
    .eq("quest_date", today)
    .single();

  if (!data) return { count: 0, completed: false, taskType: "connections" };
  return {
    count: Math.min((data.current_value as number) ?? 0, MISSION_GOAL),
    completed: !!data.completed,
    taskType: (data.task_type as "connections" | "messages") ?? "connections",
  };
}

export async function incrementConnections(
  userId: string,
  connectionDurationMs: number
): Promise<{ count: number; completed: boolean; justCompleted: boolean }> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("daily_quest_ensure_and_increment_connections", {
    p_user_id: userId,
    p_connection_duration_ms: Math.floor(connectionDurationMs),
  });

  if (error) {
    console.error("[daily-quest increment connections]", error);
    return { count: 0, completed: false, justCompleted: false };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    count: (row?.count as number) ?? 0,
    completed: !!row?.completed,
    justCompleted: !!row?.just_completed,
  };
}

export async function incrementMessages(userId: string): Promise<{ count: number; completed: boolean; justCompleted: boolean }> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("daily_quest_increment_messages", {
    p_user_id: userId,
  });

  if (error) {
    console.error("[daily-quest increment messages]", error);
    return { count: 0, completed: false, justCompleted: false };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    count: (row?.count as number) ?? 0,
    completed: !!row?.completed,
    justCompleted: !!row?.just_completed,
  };
}

export async function getStreakDays(userId: string): Promise<number> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("daily_quests")
    .select("quest_date")
    .eq("user_id", userId)
    .eq("completed", true)
    .order("quest_date", { ascending: false })
    .limit(10);

  if (!data?.length) return 0;
  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  let expectedDate = today;
  for (const row of data) {
    const d = (row.quest_date as string).slice(0, 10);
    if (d !== expectedDate) break;
    streak++;
    expectedDate = new Date(new Date(expectedDate).getTime() - 86400000).toISOString().slice(0, 10);
  }
  return streak;
}

export { MISSION_GOAL, MISSION_REWARD_COINS };
