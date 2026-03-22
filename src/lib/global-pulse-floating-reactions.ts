/**
 * Allowed one-tap floating reactions for Global Pulse (must match server.js allowlist).
 */
export const GLOBAL_PULSE_FLOATING_REACTION_EMOJIS = [
  "❤️",
  "🔥",
  "😂",
  "😍",
  "😮",
  "👏",
  "🎉",
  "✨",
] as const;

export type GlobalPulseFloatingReactionEmoji = (typeof GLOBAL_PULSE_FLOATING_REACTION_EMOJIS)[number];

export function isAllowedFloatingReactionEmoji(s: string): boolean {
  return (GLOBAL_PULSE_FLOATING_REACTION_EMOJIS as readonly string[]).includes(s);
}
