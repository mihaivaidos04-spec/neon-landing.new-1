/** Gift type keys from `Transaction.giftType` → display emoji */
export const PROFILE_GIFT_EMOJI: Record<string, string> = {
  heart: "❤️",
  rose: "🌹",
  coffee: "☕",
  diamond: "💎",
  fire: "🔥",
  rocket: "🚀",
};

export function giftEmojiForType(giftType: string): string {
  return PROFILE_GIFT_EMOJI[giftType] ?? "🎁";
}
