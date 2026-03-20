import { MAX_LOCALIZED_USERNAME_CODEPOINTS } from "./chat-usernames-by-country";
import { MAX_RANDOM_USERNAME_CODEPOINTS } from "./chat-usernames";

/**
 * Single cap for Global Pulse + demo chat: matches the longest generated handle
 * (localized fake names or Latin random username pattern).
 */
export const MAX_CHAT_DISPLAY_USERNAME_CODEPOINTS = Math.max(
  MAX_LOCALIZED_USERNAME_CODEPOINTS,
  MAX_RANDOM_USERNAME_CODEPOINTS
);

/** Truncate by Unicode code points (not UTF-16 units). */
export function truncateChatDisplayUsername(
  s: string,
  max: number = MAX_CHAT_DISPLAY_USERNAME_CODEPOINTS
): string {
  if (!s) return "";
  const cp = [...s];
  if (cp.length <= max) return s;
  return cp.slice(0, max).join("");
}
