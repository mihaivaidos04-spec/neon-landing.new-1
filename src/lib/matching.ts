/**
 * Priority-based matching logic.
 * VIP Pass (fullpass/fullweek) or >500 coins or paid VIP tier (bronze/silver/gold) → is_priority.
 * Boosted (boosted_at within 5 min, 10 coins) → also gets priority.
 * Fast Match: priority users get paired in <2s, even by "stealing" from non-priority pairs.
 *
 * Refined scoring:
 * - priority_score = (has_active_subscription ? 10 : 0) + (coin_balance / 10) + tier_boost
 * - tier_boost: bronze/silver/gold from lifetime spend + Whale (see `vip-tier.ts`)
 * - When user presses Next: prioritize matching with high priority_score users
 * - 0 coins + 0 battery → is_slow_queue; Quick Charge users get priority
 */

import { getSupabase } from "./supabase";
import { hasActivePass } from "./user-profiles";
import { getWalletBalance, spendCoinsAndRecordTotal, addCoins } from "./wallet";
import { getBatteryLevel } from "./battery";
import { prisma } from "./prisma";
import { pairingAllowed } from "./user-blocks";
import { TARGET_COUNTRY_MATCH_COST } from "./coins";
import { isPlausibleCountryCode } from "./valid-country-code";
import { matchmakingPriorityBoost, vipTierFromUser, type VipTier } from "./vip-tier";
import { createNotification } from "./create-notification";
import { getPartnerNickname } from "./partner-nickname";

const PRIORITY_COIN_THRESHOLD = 500;
const FAST_MATCH_MS = 2000;
const BOOST_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const POPULAR_LAST_SEEN_MS = 20 * 60 * 1000;

function isBoosted(boostedAt: string | null | undefined): boolean {
  if (!boostedAt) return false;
  return Date.now() - new Date(boostedAt).getTime() < BOOST_WINDOW_MS;
}

async function vipTierForMatchmaking(userId: string): Promise<VipTier> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { isVip: true },
  });
  if (!u) return "free";
  return vipTierFromUser({ isVip: u.isVip === true });
}

/** VIP Pass = Full Pass or Full Month (both set gender+location expiry) */
export async function computeIsPriority(userId: string): Promise<boolean> {
  const [hasGender, hasLocation, balance, paidTier] = await Promise.all([
    hasActivePass(userId, "gender"),
    hasActivePass(userId, "location"),
    getWalletBalance(userId),
    vipTierForMatchmaking(userId),
  ]);
  const hasVipPass = hasGender && hasLocation; // fullpass/fullweek set both
  const hasEnoughCoins = (balance ?? 0) > PRIORITY_COIN_THRESHOLD;
  const hasSpendTier = paidTier !== "free";
  return hasVipPass || hasEnoughCoins || hasSpendTier;
}

/** priority = (has_active_subscription ? 10 : 0) + (coin_balance / 10) + VIP tier boost */
export type PriorityInfo = { priority: number; isSlowQueue: boolean };

export async function computePriorityScore(userId: string): Promise<PriorityInfo> {
  const [hasGender, hasLocation, coinBalance, battery, spendTier] = await Promise.all([
    hasActivePass(userId, "gender"),
    hasActivePass(userId, "location"),
    getWalletBalance(userId),
    getBatteryLevel(userId),
    vipTierForMatchmaking(userId),
  ]);
  const hasActiveSubscription = hasGender && hasLocation;
  const coins = coinBalance ?? 0;
  const priority =
    (hasActiveSubscription ? 10 : 0) + coins / 10 + matchmakingPriorityBoost(spendTier);
  const isSlowQueue = coins === 0 && battery === 0;
  return { priority, isSlowQueue };
}

/** profileGender must equal filter when filter is "female" | "male" */
function profileMatchesGenderFilter(
  profileGender: string | null | undefined,
  filter: string | undefined
): boolean {
  if (filter !== "female" && filter !== "male") return true;
  return profileGender === filter;
}

async function fetchUserCountriesMap(userIds: string[]): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  if (userIds.length === 0) return map;
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, country: true },
  });
  for (const u of users) {
    map.set(u.id, u.country ? String(u.country).toUpperCase().slice(0, 2) : null);
  }
  return map;
}

function partnerCountryMatchesTarget(
  partnerCountry: string | null | undefined,
  target?: string
): boolean {
  if (!target) return true;
  const p = (partnerCountry ?? "").toUpperCase().slice(0, 2);
  return p === target.toUpperCase();
}

/**
 * Charge the payer (seeker with target, or waiting user who had target stored) then pair; refund if pair fails.
 */
async function createPairWithOptionalCountryCharge(
  joiningUserId: string,
  partnerId: string,
  payerUserId: string | null
): Promise<MatchResult | null> {
  if (payerUserId) {
    const spend = await spendCoinsAndRecordTotal(
      payerUserId,
      TARGET_COUNTRY_MATCH_COST,
      "match_target_country"
    );
    if (!spend.success) return null;
    const pairResult = await createPair(joiningUserId, partnerId);
    if (!pairResult) {
      const ext = `refund_country_${payerUserId}_${Date.now()}`;
      await addCoins(payerUserId, TARGET_COUNTRY_MATCH_COST, {
        externalId: ext,
        reason: "refund_match_pair_failed",
      });
      return null;
    }
    return {
      status: "matched",
      partnerId,
      newBalance: spend.newBalance,
    };
  }
  return createPair(joiningUserId, partnerId);
}

async function fetchProfileGendersMap(
  userIds: string[]
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  if (userIds.length === 0) return map;
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, profileGender: true },
  });
  for (const u of users) {
    map.set(u.id, u.profileGender ?? null);
  }
  return map;
}

/** Higher = more “active / popular” for VIP match preference */
async function fetchPartnerPopularityScores(
  userIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (userIds.length === 0) return map;
  const now = Date.now();
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, currentLevel: true, lastSeenAt: true, xp: true },
  });
  for (const u of users) {
    const seenMs = u.lastSeenAt ? now - u.lastSeenAt.getTime() : Number.POSITIVE_INFINITY;
    const activeBoost = seenMs <= POPULAR_LAST_SEEN_MS ? 80 : 0;
    const levelScore = (u.currentLevel ?? 1) * 12;
    const xpScore = Math.min(40, Math.floor((u.xp ?? 0) / 500));
    map.set(u.id, activeBoost + levelScore + xpScore);
  }
  return map;
}

export type MatchResult =
  | { status: "waiting" }
  | { status: "matched"; partnerId: string; newBalance?: number }
  | { status: "error"; error: string };

export type JoinMatchPoolOptions = {
  /**
   * ISO 3166-1 alpha-2. Only pair with peers whose `User.country` matches (set from IP / geo headers or profile sync).
   * Charges {@link TARGET_COUNTRY_MATCH_COST} coins when a match is formed (joining user pays).
   */
  targetCountryCode?: string | null;
};

/**
 * Join the matching pool and run matching logic.
 * Priority users go to front; Fast Match can steal from non-priority pairs.
 * Stores priority_score and is_slow_queue for refined matching.
 * @param filter - "everyone" | "female" | "male" | "verified" (API requires Neon VIP / User.isVip for female|male)
 */
export async function joinMatchPool(
  userId: string,
  filter?: string | null,
  options?: JoinMatchPoolOptions
): Promise<MatchResult> {
  const supabase = getSupabase();
  const [isPriority, { priority, isSlowQueue }, vipRow] = await Promise.all([
    computeIsPriority(userId),
    computePriorityScore(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { isVip: true } }),
  ]);
  const joiningIsNeonVip = vipRow?.isVip === true;

  const rawTarget = options?.targetCountryCode;
  const targetCountryCode =
    typeof rawTarget === "string" &&
    rawTarget.trim().length >= 2 &&
    isPlausibleCountryCode(rawTarget.trim().toUpperCase())
      ? rawTarget.trim().toUpperCase().slice(0, 2)
      : undefined;

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
    match_target_country: targetCountryCode ?? null,
  });
  if (insertErr) {
    console.error("[matching join]", insertErr);
    return { status: "error", error: insertErr.message };
  }

  // Run matching: try to pair this user (prioritize high priority_score partners)
  const matchFilter =
    !filter || filter === "everyone" ? undefined : filter;

  return runMatching(
    userId,
    isPriority,
    isSlowQueue,
    joiningIsNeonVip,
    matchFilter,
    targetCountryCode
  );
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
  joiningIsNeonVip: boolean,
  filter?: string,
  targetCountryCode?: string
): Promise<MatchResult> {
  const supabase = getSupabase();

  const joiningProfile = await prisma.user.findUnique({
    where: { id: joiningUserId },
    select: { country: true },
  });
  const joiningUserCountry = joiningProfile?.country
    ? String(joiningProfile.country).toUpperCase().slice(0, 2)
    : null;

  // 1. If joining user is priority: try to steal first (Fast Match)
  if (joiningIsPriority) {
    const stealResult = await tryStealForPriority(
      joiningUserId,
      filter,
      targetCountryCode
    );
    if (stealResult) return stealResult;
  }

  // 2. Find waiting users: boosted first, then !is_slow_queue (Quick Charge), then by priority_score desc, then FIFO
  const query = supabase
    .from("active_users")
    .select(
      "user_id, boosted_at, is_priority, is_slow_queue, priority_score, joined_at, match_target_country"
    )
    .eq("status", "waiting")
    .neq("user_id", joiningUserId);

  const { data: waiting } = await query;

  const ids = (waiting ?? []).map((r) => r.user_id as string);
  const popMap = joiningIsNeonVip ? await fetchPartnerPopularityScores(ids) : new Map<string, number>();
  const genderMap =
    filter === "female" || filter === "male"
      ? await fetchProfileGendersMap(ids)
      : null;
  const countryMap = targetCountryCode
    ? await fetchUserCountriesMap(ids)
    : null;

  const sorted = (waiting ?? []).sort((a, b) => {
    const aBoosted = isBoosted(a.boosted_at as string | null);
    const bBoosted = isBoosted(b.boosted_at as string | null);
    if (aBoosted && !bBoosted) return -1;
    if (!aBoosted && bBoosted) return 1;
    // Quick Charge users (not slow queue) before slow queue
    const aSlow = a.is_slow_queue ?? false;
    const bSlow = b.is_slow_queue ?? false;
    if (aSlow !== bSlow) return aSlow ? 1 : -1;
    // Neon VIP (Whale pack): prefer active / high-level partners first
    if (joiningIsNeonVip) {
      const pa = popMap.get(a.user_id as string) ?? 0;
      const pb = popMap.get(b.user_id as string) ?? 0;
      if (pa !== pb) return pb - pa;
    }
    // Prefer high priority_score (matching with similar/high priority users)
    const aScore = (a.priority_score as number) ?? 0;
    const bScore = (b.priority_score as number) ?? 0;
    if (aScore !== bScore) return bScore - aScore;
    if (a.is_priority !== b.is_priority) return a.is_priority ? -1 : 1;
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
  });
  for (const partner of sorted) {
    const pid = partner.user_id as string;
    const partnerWantsCountry =
      typeof partner.match_target_country === "string" &&
      partner.match_target_country.length >= 2
        ? partner.match_target_country.toUpperCase().slice(0, 2)
        : null;

    if (genderMap && !profileMatchesGenderFilter(genderMap.get(pid) ?? null, filter)) continue;
    if (
      countryMap &&
      !partnerCountryMatchesTarget(countryMap.get(pid) ?? null, targetCountryCode)
    )
      continue;
    if (
      partnerWantsCountry &&
      !partnerCountryMatchesTarget(joiningUserCountry, partnerWantsCountry)
    )
      continue;

    if (!(await pairingAllowed(joiningUserId, pid))) continue;

    const payerUserId = targetCountryCode
      ? joiningUserId
      : partnerWantsCountry
        ? pid
        : null;

    const pairResult = await createPairWithOptionalCountryCharge(
      joiningUserId,
      pid,
      payerUserId
    );
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
  const vipRow = await prisma.user.findUnique({ where: { id: userId }, select: { isVip: true } });
  return runMatching(userId, isEffectivelyPriority, isSlowQueue, vipRow?.isVip === true, undefined);
}

/**
 * Try to steal a partner from a non-priority pair for a priority user.
 * Only steal if the non-priority pair has been matched for less than FAST_MATCH_MS.
 */
async function tryStealForPriority(
  priorityUserId: string,
  genderFilter?: string,
  targetCountryCode?: string
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

    if (genderFilter === "female" || genderFilter === "male") {
      const partnerUser = await prisma.user.findUnique({
        where: { id: partnerId },
        select: { profileGender: true, country: true },
      });
      if (!profileMatchesGenderFilter(partnerUser?.profileGender ?? null, genderFilter)) continue;
      if (
        targetCountryCode &&
        !partnerCountryMatchesTarget(partnerUser?.country ?? null, targetCountryCode)
      )
        continue;
    } else if (targetCountryCode) {
      const partnerUser = await prisma.user.findUnique({
        where: { id: partnerId },
        select: { country: true },
      });
      if (!partnerCountryMatchesTarget(partnerUser?.country ?? null, targetCountryCode)) continue;
    }

    if (!(await pairingAllowed(priorityUserId, partnerId))) continue;

    if (targetCountryCode) {
      const bal = await getWalletBalance(priorityUserId);
      if ((bal ?? 0) < TARGET_COUNTRY_MATCH_COST) continue;
    }

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

    const payerUserId = targetCountryCode ? priorityUserId : null;
    const pairResult = await createPairWithOptionalCountryCharge(
      priorityUserId,
      partnerId,
      payerUserId
    );
    if (pairResult) return pairResult;
  }
  return null;
}

async function createPair(
  userA: string,
  userB: string
): Promise<MatchResult | null> {
  if (!(await pairingAllowed(userA, userB))) return null;
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
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userA },
        data: { totalMatches: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: userB },
        data: { totalMatches: { increment: 1 } },
      }),
    ]);
  } catch (e) {
    console.error("[matching createPair] totalMatches increment", e);
  }

  void Promise.all([getPartnerNickname(userA), getPartnerNickname(userB)])
    .then(([nickA, nickB]) => {
      const labelB = nickB?.trim() || "Someone";
      const labelA = nickA?.trim() || "Someone";
      return Promise.all([
        createNotification({
          userId: userA,
          type: "match",
          title: "New match!",
          message: `You're paired with ${labelB}. Say hi!`,
          link: "/",
        }),
        createNotification({
          userId: userB,
          type: "match",
          title: "New match!",
          message: `You're paired with ${labelA}. Say hi!`,
          link: "/",
        }),
      ]);
    })
    .catch(() => {});

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
    .select(
      "user_id, boosted_at, is_priority, is_slow_queue, priority_score, joined_at, match_target_country"
    )
    .eq("status", "waiting")
    .neq("user_id", currentUserId);

  const vipRow = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { isVip: true },
  });
  const joiningIsNeonVip = vipRow?.isVip === true;
  const ids = (data ?? []).map((r) => r.user_id as string);
  const popMap = joiningIsNeonVip ? await fetchPartnerPopularityScores(ids) : new Map<string, number>();

  const sorted = (data ?? []).sort((a, b) => {
    const aBoosted = isBoosted(a.boosted_at as string | null);
    const bBoosted = isBoosted(b.boosted_at as string | null);
    if (aBoosted && !bBoosted) return -1;
    if (!aBoosted && bBoosted) return 1;
    const aSlow = a.is_slow_queue ?? false;
    const bSlow = b.is_slow_queue ?? false;
    if (aSlow !== bSlow) return aSlow ? 1 : -1;
    if (joiningIsNeonVip) {
      const pa = popMap.get(a.user_id as string) ?? 0;
      const pb = popMap.get(b.user_id as string) ?? 0;
      if (pa !== pb) return pb - pa;
    }
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
