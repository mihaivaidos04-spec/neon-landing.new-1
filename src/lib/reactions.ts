/**
 * Reaction types and helpers.
 */

export type ReactionId = "heart" | "fire" | "laugh" | "love" | "wow";

export const REACTIONS: { id: ReactionId; emoji: string }[] = [
  { id: "heart", emoji: "❤️" },
  { id: "fire", emoji: "🔥" },
  { id: "laugh", emoji: "😂" },
  { id: "love", emoji: "😍" },
  { id: "wow", emoji: "😮" },
];
