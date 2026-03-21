/** Deterministic gold vs electric-blue neon for VIP display names */
export function neonVipGlowVariant(userId: string): "gold" | "blue" {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h + userId.charCodeAt(i) * (i + 1)) % 2;
  return h === 0 ? "gold" : "blue";
}
