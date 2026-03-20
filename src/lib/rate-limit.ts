/**
 * In-memory rate limiter for server actions.
 * For production, use Redis or similar.
 */

const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_LOGIN_PER_WINDOW = 5;
const MAX_GIFT_PER_WINDOW = 20;
const MAX_ACTIVITY_PER_WINDOW = 30;

export type RateLimitAction = "login" | "gift" | "activity" | "wallet_add";

const MAX_WALLET_ADD_PER_WINDOW = 20;

function getLimit(action: RateLimitAction): number {
  switch (action) {
    case "login":
      return MAX_LOGIN_PER_WINDOW;
    case "gift":
      return MAX_GIFT_PER_WINDOW;
    case "activity":
      return MAX_ACTIVITY_PER_WINDOW;
    case "wallet_add":
      return MAX_WALLET_ADD_PER_WINDOW;
    default:
      return 10;
  }
}

export function checkRateLimit(
  userId: string,
  action: RateLimitAction
): { allowed: boolean; remaining: number; retryAfterMs?: number } {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const limit = getLimit(action);

  let entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(key, entry);
  }

  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  const allowed = entry.count <= limit;
  const retryAfterMs = allowed ? undefined : Math.max(0, entry.resetAt - now);

  return { allowed, remaining, retryAfterMs };
}

export function consumeRateLimit(userId: string, action: RateLimitAction): boolean {
  const { allowed } = checkRateLimit(userId, action);
  return allowed;
}

const MATCH_WINDOW_MS = 60 * 1000;
const MAX_MATCH_PER_WINDOW = 30;
const matchStore = new Map<string, { count: number; resetAt: number }>();

export async function checkMatchRateLimit(userId: string): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const now = Date.now();
  let entry = matchStore.get(userId);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + MATCH_WINDOW_MS };
    matchStore.set(userId, entry);
  }
  entry.count++;
  const allowed = entry.count <= MAX_MATCH_PER_WINDOW;
  return {
    allowed,
    retryAfterMs: allowed ? undefined : Math.max(0, entry.resetAt - now),
  };
}
