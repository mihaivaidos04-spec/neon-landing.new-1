/**
 * Battery level (0-100) – stored in user_profiles for auth users.
 * Client calls /api/battery/update every 5 min (10 min for VIP).
 */

import { getSupabase } from "./supabase";

export async function getBatteryLevel(userId: string): Promise<number> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("user_profiles")
    .select("battery_level")
    .eq("user_id", userId)
    .single();

  const level = data?.battery_level as number | null | undefined;
  return level != null ? Math.max(0, Math.min(100, level)) : 100;
}

export async function decreaseBattery(
  userId: string,
  amount: number = 1
): Promise<{ battery: number }> {
  const supabase = getSupabase();

  const { data: row } = await supabase
    .from("user_profiles")
    .select("battery_level")
    .eq("user_id", userId)
    .single();

  const current = (row?.battery_level as number) ?? 100;
  const next = Math.max(0, current - amount);

  await supabase
    .from("user_profiles")
    .upsert(
      {
        user_id: userId,
        battery_level: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  return { battery: next };
}

export async function chargeBattery(
  userId: string,
  amount: number
): Promise<{ battery: number }> {
  const supabase = getSupabase();

  const { data: row } = await supabase
    .from("user_profiles")
    .select("battery_level")
    .eq("user_id", userId)
    .single();

  const current = (row?.battery_level as number) ?? 0;
  const next = Math.min(100, current + amount);

  await supabase
    .from("user_profiles")
    .upsert(
      {
        user_id: userId,
        battery_level: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  return { battery: next };
}

/** Retention: 10% battery every 2 hours, max 50%. Call on login / battery fetch. */
const REGEN_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
const REGEN_AMOUNT = 10;
const REGEN_MAX_LEVEL = 50;

export async function regenerateBatteryIfDue(
  userId: string
): Promise<{ battery: number; regened: boolean }> {
  const supabase = getSupabase();

  const { data: row } = await supabase
    .from("user_profiles")
    .select("battery_level, last_battery_regen_at")
    .eq("user_id", userId)
    .single();

  const current = (row?.battery_level as number) ?? 100;
  const lastRegen = row?.last_battery_regen_at as string | null | undefined;

  if (current >= REGEN_MAX_LEVEL) return { battery: current, regened: false };

  const now = Date.now();
  const elapsed = lastRegen ? now - new Date(lastRegen).getTime() : REGEN_INTERVAL_MS + 1;
  if (elapsed < REGEN_INTERVAL_MS) return { battery: current, regened: false };

  const next = Math.min(REGEN_MAX_LEVEL, current + REGEN_AMOUNT);

  await supabase
    .from("user_profiles")
    .upsert(
      {
        user_id: userId,
        battery_level: next,
        last_battery_regen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  return { battery: next, regened: true };
}
