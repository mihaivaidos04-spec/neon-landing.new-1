/**
 * Chat block: 3 consecutive spam → 10 min block.
 * In-memory per session.
 */

const BLOCK_DURATION_MS = 10 * 60 * 1000;
const SPAM_THRESHOLD = 3;

let consecutiveSpamCount = 0;
let chatBlockedUntil = 0;

export function recordSpamMessage(): void {
  consecutiveSpamCount++;
  if (consecutiveSpamCount >= SPAM_THRESHOLD) {
    chatBlockedUntil = Date.now() + BLOCK_DURATION_MS;
    consecutiveSpamCount = 0;
  }
}

export function recordCleanMessage(): void {
  consecutiveSpamCount = 0;
}

export function isChatBlocked(): boolean {
  if (Date.now() >= chatBlockedUntil) {
    chatBlockedUntil = 0;
    return false;
  }
  return true;
}

export function getChatBlockRemainingMs(): number {
  if (Date.now() >= chatBlockedUntil) return 0;
  return chatBlockedUntil - Date.now();
}
