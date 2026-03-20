/**
 * Minimal server-side gate for Global Pulse (blocks obvious scams / links).
 * Client runs full filter; this prevents raw socket bypass.
 */
const BLOCK_REGEX = [
  /https?:\/\//i,
  /\bt\.me\//i,
  /\btelegram\b/i,
  /\bwhatsapp\b/i,
  /\bwa\.me\b/i,
  /\bdiscord\.gg\b/i,
  /\bdiscord\.com\/invite\b/i,
  /\bcashapp\b|\bvenmo\b|\bpaypal\.me\b/i,
  /\b(send|transfer)\s+(btc|usdt|eth|crypto)\b/i,
  /\b(free\s+)?(nitro|robux)\s*(giveaway)?\b/i,
  /\bclick\s+(here|this\s+link)\b/i,
];

export function allowGlobalPulseServerMessage(text) {
  if (typeof text !== "string") return false;
  const t = text.trim();
  if (t.length === 0 || t.length > 280) return false;
  if (BLOCK_REGEX.some((r) => r.test(t))) return false;
  return true;
}
