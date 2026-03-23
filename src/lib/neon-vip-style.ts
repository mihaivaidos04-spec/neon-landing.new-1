import { normalizeVipTier, type VipTier } from "./vip-tier";

/** Deterministic gold vs electric-blue neon for VIP display names */
export function neonVipGlowVariant(userId: string): "gold" | "blue" {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h + userId.charCodeAt(i) * (i + 1)) % 2;
  return h === 0 ? "gold" : "blue";
}

/**
 * Global Pulse username styling: tier colors/animations, with legacy `neonVip` rows
 * (pre-`vipTier` DB field) treated as gold when tier is still "free".
 */
export function globalPulseUsernameClass(
  vipTier: string | null | undefined,
  neonVip: boolean | undefined,
  userId: string
): string {
  const t: VipTier = normalizeVipTier(vipTier);
  if (t === "gold" || (t === "free" && neonVip)) return "vip-chat-name-rainbow";
  if (t === "silver") return "vip-chat-name-silver";
  if (t === "bronze") return "vip-chat-name-bronze";
  if (neonVip) {
    return neonVipGlowVariant(userId) === "gold" ? "neon-vip-name-gold" : "neon-vip-name-blue";
  }
  return "";
}
