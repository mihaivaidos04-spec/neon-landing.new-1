/**
 * Rate limiter for API endpoints – uses Supabase RPC for atomic check.
 */

import { getSupabase } from "./supabase";

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 15;

export async function checkRateLimit(
  userId: string,
  action: string
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("rate_limit_check", {
    p_user_id: userId,
    p_action: action,
    p_window_ms: WINDOW_MS,
    p_max_requests: MAX_REQUESTS,
  });

  if (error) {
    console.error("[rate_limit]", error);
    return { allowed: true };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const allowed = !!row?.allowed;
  const retryAfterMs = row?.retry_after_ms as number | undefined;

  return allowed ? { allowed: true } : { allowed: false, retryAfterMs: retryAfterMs ?? 60000 };
}

const MATCH_NEXT_WINDOW_MS = 60 * 1000;
const MATCH_NEXT_MAX = 10;

export async function checkMatchRateLimit(
  userId: string
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("rate_limit_check", {
    p_user_id: userId,
    p_action: "match_next",
    p_window_ms: MATCH_NEXT_WINDOW_MS,
    p_max_requests: MATCH_NEXT_MAX,
  });

  if (error) {
    console.error("[rate_limit match_next]", error);
    return { allowed: true };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const allowed = !!row?.allowed;
  const retryAfterMs = row?.retry_after_ms as number | undefined;

  return allowed ? { allowed: true } : { allowed: false, retryAfterMs: retryAfterMs ?? 60000 };
}
