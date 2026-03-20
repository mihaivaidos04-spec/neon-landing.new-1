export const DEFAULT_LEVELS: { level: number; xpRequired: number; badgeIcon: string }[] = [
  { level: 1, xpRequired: 0, badgeIcon: "🌟" },
  { level: 2, xpRequired: 100, badgeIcon: "⭐" },
  { level: 3, xpRequired: 300, badgeIcon: "✨" },
  { level: 4, xpRequired: 600, badgeIcon: "💫" },
  { level: 5, xpRequired: 1000, badgeIcon: "🔥" },
  { level: 6, xpRequired: 1500, badgeIcon: "💎" },
  { level: 7, xpRequired: 2200, badgeIcon: "👑" },
  { level: 8, xpRequired: 3000, badgeIcon: "🏆" },
  { level: 9, xpRequired: 4000, badgeIcon: "🎖️" },
  { level: 10, xpRequired: 5500, badgeIcon: "💠" },
];

export const XP_LOGIN = 5;
export const XP_GIFT_SENT_PER_COIN = 1; // 1 XP per coin spent
export const XP_GIFT_RECEIVED_BONUS = 3; // Bonus XP for receiving

export function getXpForGiftSent(coins: number): number {
  return Math.floor(coins * XP_GIFT_SENT_PER_COIN);
}
