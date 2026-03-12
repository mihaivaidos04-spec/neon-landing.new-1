/**
 * Priority-based matching logic.
 * VIP Pass (fullpass/fullweek) or >500 coins → is_priority → front of queue.
 * Boosted (boosted_at within 5 min, 10 coins) → also gets priority.
 * Fast Match: priority users get paired in <2s, even by "stealing" from non-priority pairs.
 *
 * Refined scoring:
 * - priority_score = (has_active_subscription ? 10 : 0) + (coin_balance / 10)
 * - When user presses Next: prioritize matching with high priority_score users
 * - 0 coins + 0 battery → is_slow_queue; Quick Charge users get priority
 */

import { getSupabase } from "./supabase";
import { hasActivePass } from "./user-profiles";
import { getWalletBalance } from "./wallet";
import { getBatteryLevel } from "./battery";

const PRIORITY_COIN_THRESHOLD = 500;
const FAST_MATCH_MS = 2000;
const BOOST_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function isBoosted(boostedAt: string | null | undefined): boolean {
  if (!boostedAt) return false;
  return Date.now() - new Date(boostedAt).getTime() < BOOST_WINDOW_MS;
}

/** VIP Pass = Full Pass or Full Month (both set gender+location expiry) */
export async function computeIsPriority(userId: string): Promise<boolean> {
  const [hasGender, hasLocation, balance] = await Promise.all([
    hasActivePass(userId, "gender"),
    hasActivePass(userId, "location"),
    getWalletBalance(userId),
  ]);
  const hasVipPass = hasGender && hasLocation; // fullpass/fullweek set both
  const hasEnoughCoins = (balance ?? 0) > PRIORITY_COIN_THRESHOLD;
  return hasVipPass || hasEnoughCoins;
}

/** priority = (has_active_subscription ? 10 : 0) + (coin_balance / 10) */
export type PriorityInfo = { priority: number; isSlowQueue: boolean };

export async function computePriorityScore(userId: string): Promise<PriorityInfo> {
  const [hasGender, hasLocation, coinBalance, battery] = await Promise.all([
    hasActivePass(userId, "gender"),
    hasActivePass(userId, "location"),
    getWalletBalance(userId),
    getBatteryLevel(userId),
  ]);
  const hasActiveSubscription = hasGender && hasLocation;
  const coins = coinBalance ?? 0;
  const priority = (hasActiveSubscription ? 10 : 0) + coins / 10;
  const isSlowQueue = coins === 0 && battery === 0;
  return { priority, isSlowQueue };
}

export type MatchResult =
  | { status: "waiting" }
  | { status: "matched"; partnerId: string }
  | { status: "error"; error: string };

/**
 * Join the matching pool and run matching logic.
 * Priority users go to front; Fast Match can steal from non-priority pairs.
 * Stores priority_score and is_slow_queue for refined matching.
 * @param filter - "everyone" | "female" | "male" | "verified" (client must check 5 coins for gender filters)
 */
export async function joinMatchPool(userId: string, filter?: string | null): Promise<MatchResult> {
  const supabase = getSupabase();
  const [isPriority, { priority, isSlowQueue }] = await Promise.all([
    computeIsPriority(userId),
    computePriorityScore(userId),
  ]);

  // Remove any existing row (re-join)
  await supabase.from("active_users").delete().eq("user_id", userId);

  const now = new Date().toISOString();
  const { error: insertErr } = await supabase.from("active_users").insert({
    user_id: userId,
    is_priority: isPriority,
    priority_score: priority,
    is_slow_queue: isSlowQueue,
    status: "waiting",
    joined_at: now,
    updated_at: now,
  });
  if (insertErr) {
    console.error("[matching join]", insertErr);
    return { status: "error", error: insertErr.message };
  }

  // Run matching: try to pair this user (prioritize high priority_score partners)
  return runMatching(userId, isPriority, isSlowQueue, filter ?? undefined);
}

/**
 * Run matching logic. Priority users get first pick; can steal from non-priority.
 * When user presses Next: prioritize matching with high priority_score users.
 * Slow queue (0 coins + 0 battery) users get lower priority; Quick Charge users first.
 */
async function runMatching(
  joiningUserId: string,
  joiningIsPriority: boolean,
  joiningIsSlowQueue: boolean,
  filter?: string
): Promise<MatchResult> {
  const supabase = getSupabase();

  // 1. If joining user is priority: try to steal first (Fast Match)
  if (joiningIsPriority) {
    const stealResult = await tryStealForPriority(joiningUserId);
    if (stealResult) return stealResult;
  }

  // 2. Find waiting users: boosted first, then !is_slow_queue (Quick Charge), then by priority_score desc, then FIFO
  let query = supabase
    .from("active_users")
    .select("user_id, boosted_at, is_priority, is_slow_queue, priority_score, joined_at")
    .eq("status", "waiting")
    .neq("user_id", joiningUserId);

  const { data: waiting } = await query;

  const sorted = (waiting ?? []).sort((a, b) => {
    const aBoosted = isBoosted(a.boosted_at as string | null);
    const bBoosted = isBoosted(b.boosted_at as string | null);
    if (aBoosted && !bBoosted) return -1;
    if (!aBoosted && bBoosted) return 1;
    // Quick Charge users (not slow queue) before slow queue
    const aSlow = a.is_slow_queue ?? false;
    const bSlow = b.is_slow_queue ?? false;
    if (aSlow !== bSlow) return aSlow ? 1 : -1;
    // Prefer high priority_score (matching with similar/high priority users)
    const aScore = (a.priority_score as number) ?? 0;
    const bScore = (b.priority_score as number) ?? 0;
    if (aScore !== bScore) return bScore - aScore;
    if (a.is_priority !== b.is_priority) return a.is_priority ? -1 : 1;
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
  });
  const partner = sorted[0];
  if (partner) {
    const pairResult = await createPair(joiningUserId, partner.user_id);
    if (pairResult) return pairResult;
  }

  return { status: "waiting" };
}

/**
 * Re-run matching for a user who just boosted (or has boosted_at within 5 min).
 * Used after boost API updates boosted_at.
 */
export async function reRunMatchingForUser(userId: string): Promise<MatchResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("active_users")
    .select("boosted_at, is_priority, is_slow_queue, status")
    .eq("user_id", userId)
    .single();

  if (error || !data || data.status !== "waiting") {
    return { status: "waiting" };
  }

  const isEffectivelyPriority =
    data.is_priority || isBoosted(data.boosted_at as string | null);
  const isSlowQueue = data.is_slow_queue ?? false;
  return runMatching(userId, isEffectivelyPriority, isSlowQueue);
}

/**
 * Try to steal a partner from a non-priority pair for a priority user.
 * Only steal if the non-priority pair has been matched for less than FAST_MATCH_MS.
 */
async function tryStealForPriority(
  priorityUserId: string
): Promise<MatchResult | null> {
  const supabase = getSupabase();
  const cutoff = new Date(Date.now() - FAST_MATCH_MS).toISOString();

  // Find a pair where: both are non-priority and non-boosted, matched recently
  const { data: pairs } = await supabase
    .from("active_users")
    .select("user_id, partner_id, is_priority, boosted_at, matched_at")
    .eq("status", "matched")
    .not("partner_id", "is", null)
    .gte("matched_at", cutoff);

  if (!pairs?.length) return null;

  // Pick first non-priority, non-boosted user in a pair (we'll steal their partner)
  for (const row of pairs) {
    if (row.is_priority || isBoosted(row.boosted_at as string | null)) continue;
    const partnerId = row.partner_id as string;
    if (!partnerId) continue;

    // Verify partner exists and is non-priority, non-boosted
    const { data: partnerRow } = await supabase
      .from("active_users")
      .select("is_priority, boosted_at")
      .eq("user_id", partnerId)
      .single();
    if (
      partnerRow?.is_priority ||
      isBoosted(partnerRow?.boosted_at as string | null)
    )
      continue;

    // Break the pair: put partner back to waiting, match them with priority user
    await supabase
      .from("active_users")
      .update({
        status: "waiting",
        partner_id: null,
        matched_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", row.user_id);

    await supabase
      .from("active_users")
      .update({
        status: "waiting",
        partner_id: null,
        matched_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", partnerId);

    // Create new pair: priority user + stolen partner
    await createPair(priorityUserId, partnerId);
    return { status: "matched", partnerId };
  }
  return null;
}

async function createPair(
  userA: string,
  userB: string
): Promise<MatchResult | null> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { error: errA } = await supabase
    .from("active_users")
    .update({
      status: "matched",
      partner_id: userB,
      matched_at: now,
      updated_at: now,
    })
    .eq("user_id", userA);

  const { error: errB } = await supabase
    .from("active_users")
    .update({
      status: "matched",
      partner_id: userA,
      matched_at: now,
      updated_at: now,
    })
    .eq("user_id", userB);

  if (errA || errB) {
    console.error("[matching createPair]", errA ?? errB);
    return null;
  }
  return { status: "matched", partnerId: userB };
}

export async function leaveMatchPool(userId: string): Promise<void> {
  const supabase = getSupabase();
  const { data: row } = await supabase
    .from("active_users")
    .select("partner_id")
    .eq("user_id", userId)
    .single();

  if (row?.partner_id) {
    await supabase
      .from("active_users")
      .update({
        status: "waiting",
        partner_id: null,
        matched_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", row.partner_id as string);
  }

  await supabase.from("active_users").delete().eq("user_id", userId);
}

/**
 * Get next N users in the waiting queue (for Queue Preview).
 * Excludes current user. Ordered by: boosted > Quick Charge (!slow) > priority_score desc > FIFO.
 */
export async function getQueuePreview(
  currentUserId: string,
  limit: number = 3
): Promise<{ userId: string }[]> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("active_users")
    .select("user_id, boosted_at, is_priority, is_slow_queue, priority_score, joined_at")
    .eq("status", "waiting")
    .neq("user_id", currentUserId);

  const sorted = (data ?? []).sort((a, b) => {
    const aBoosted = isBoosted(a.boosted_at as string | null);
    const bBoosted = isBoosted(b.boosted_at as string | null);
    if (aBoosted && !bBoosted) return -1;
    if (!aBoosted && bBoosted) return 1;
    const aSlow = a.is_slow_queue ?? false;
    const bSlow = b.is_slow_queue ?? false;
    if (aSlow !== bSlow) return aSlow ? 1 : -1;
    const aScore = (a.priority_score as number) ?? 0;
    const bScore = (b.priority_score as number) ?? 0;
    if (aScore !== bScore) return bScore - aScore;
    if (a.is_priority !== b.is_priority) return a.is_priority ? -1 : 1;
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
  });

  return sorted.slice(0, limit).map((r) => ({ userId: r.user_id }));
}

/**
 * Match current user with a specific partner (for Undo Next).
 * Partner must be in "waiting" status. Deducts coins via API; this only handles matching.
 */
export async function matchWithPartner(
  userId: string,
  partnerId: string
): Promise<MatchResult> {
  const supabase = getSupabase();

  // Remove current user from pool if present
  await supabase.from("active_users").delete().eq("user_id", userId);

  // Check if partner is waiting
  const { data: partnerRow, error: partnerErr } = await supabase
    .from("active_users")
    .select("status")
    .eq("user_id", partnerId)
    .single();

  if (partnerErr || !partnerRow || partnerRow.status !== "waiting") {
    // Partner not available; join normal pool instead
    return joinMatchPool(userId);
  }

  const pairResult = await createPair(userId, partnerId);
  return pairResult ?? { status: "waiting" };
}

export async function getMatchStatus(userId: string): Promise<MatchResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("active_users")
    .select("status, partner_id")
    .eq("user_id", userId)
    .single();

  if (error || !data) return { status: "waiting" };
  if (data.status === "matched" && data.partner_id) {
    return { status: "matched", partnerId: data.partner_id as string };
  }
  return { status: "waiting" };
}
