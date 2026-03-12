/**
 * Wallet server-side helpers – used by API routes.
 */

import { getSupabase } from "./supabase";

export type SpendResult = { success: boolean; newBalance: number; error?: string };
export type AddResult = { success: boolean; newBalance: number; error?: string };

export async function getWalletBalance(userId: string): Promise<number | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();
  if (error || !data) return null;
  return data.balance as number;
}

export async function spendCoins(
  userId: string,
  amount: number,
  reason?: string
): Promise<SpendResult> {
  if (amount <= 0) return { success: false, newBalance: 0, error: "Invalid amount" };
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("wallet_spend", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason ?? null,
  });
  if (error) {
    console.error("[wallet spend]", error);
    return { success: false, newBalance: 0, error: error.message };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { success: false, newBalance: 0, error: "No result" };
  return {
    success: row.success as boolean,
    newBalance: (row.new_balance as number) ?? 0,
    error: row.error_message as string | undefined,
  };
}

export async function addCoins(
  userId: string,
  amount: number,
  options?: { externalId?: string; reason?: string }
): Promise<AddResult> {
  if (amount <= 0) return { success: false, newBalance: 0, error: "Invalid amount" };
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("wallet_add", {
    p_user_id: userId,
    p_amount: amount,
    p_external_id: options?.externalId ?? null,
    p_reason: options?.reason ?? null,
  });
  if (error) {
    console.error("[wallet add]", error);
    return { success: false, newBalance: 0, error: error.message };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { success: false, newBalance: 0, error: "No result" };
  return {
    success: row.success as boolean,
    newBalance: (row.new_balance as number) ?? 0,
    error: row.error_message as string | undefined,
  };
}
