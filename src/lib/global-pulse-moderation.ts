import { moderateText, type ModerationResult } from "./text-moderation";

/** Extra scam / solicitation patterns — block send (no masking). */
const SCAM_OR_TOXIC_REGEX: RegExp[] = [
  /\bt\.me\//i,
  /\btelegram\b.*\b(me|dm|msg)\b/i,
  /\bwhatsapp\b|\bwa\.me\b/i,
  /\bdiscord\.gg\b|\bdiscord\.com\/invite\b/i,
  /\b(onlyfans|chaturbate|livejasmin)\b/i,
  /\b(send|wire|transfer)\s+(\$|€|£|usd|money|btc|usdt)\b/i,
  /\b(click|tap)\s+(this\s+)?(link|url)\b/i,
  /\b(free\s+)?(crypto|bitcoin)\s*(giveaway|double)\b/i,
  /\b(verify|confirm)\s+your\s+(account|wallet)\b/i,
  /\b(nude|nudes)\s+(pic|pics|trade)\b/i,
  /\b(underage|minor)\b|\bcp\b/i,
];

export type GlobalPulseBlockResult = {
  blocked: boolean;
  reason?: string;
  moderation?: ModerationResult;
};

export type GlobalPulseSendPrep =
  | { ok: true; text: string; moderation: ModerationResult }
  | { ok: false; reason: string; systemAlert: boolean; moderation?: ModerationResult };

/**
 * Prepare outgoing Global Pulse text after `bad-words` + masks:
 * - Profanity → asterisks (allowed through).
 * - Phones / external URLs → blocked (tiny system alert).
 * - Scam / toxic regex → blocked.
 */
export function prepareGlobalPulseOutgoingMessage(text: string): GlobalPulseSendPrep {
  const trimmed = (text ?? "").trim();
  if (!trimmed) {
    return { ok: false, reason: "Empty message", systemAlert: true };
  }
  if (trimmed.length > 280) {
    return { ok: false, reason: "Message too long (max 280)", systemAlert: true };
  }

  for (const r of SCAM_OR_TOXIC_REGEX) {
    if (r.test(trimmed)) {
      return {
        ok: false,
        reason: "Message looks like spam or a scam. Please keep Global Pulse friendly.",
        systemAlert: true,
      };
    }
  }

  const moderation = moderateText(trimmed);

  if (moderation.hadPhone || moderation.hadExternalLink) {
    return {
      ok: false,
      reason: "Phone numbers and external links aren’t allowed in Pulse.",
      systemAlert: true,
      moderation,
    };
  }

  const out = moderation.filtered.trim();
  if (!out) {
    return { ok: false, reason: "Message not allowed.", systemAlert: true, moderation };
  }

  return { ok: true, text: out, moderation };
}

/**
 * @deprecated Prefer `prepareGlobalPulseOutgoingMessage` for send flow.
 * Kept for any legacy checks — treats profanity-only as **not** blocked (masked).
 */
export function shouldBlockGlobalPulseMessage(text: string): GlobalPulseBlockResult {
  const prep = prepareGlobalPulseOutgoingMessage(text);
  if (prep.ok) {
    return { blocked: false, moderation: prep.moderation };
  }
  return { blocked: true, reason: prep.reason };
}
