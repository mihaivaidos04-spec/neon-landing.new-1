import type { DefaultSession } from "next-auth";
import type { VipTier } from "@/src/lib/vip-tier";

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id?: string;
      coins?: number;
    };
    userId?: string;
    /** Set when user chose a public video-chat display name */
    nickname?: string | null;
    tier?: string;
    coins?: number;
    isGhost?: boolean;
    xp?: number;
    currentLevel?: number;
    /** Lifetime USD from Stripe (billing packs) */
    totalSpent?: number;
    /** ISO 3166-1 alpha-2 from User.country (IP or manual) */
    countryCode?: string | null;
    /** Whale pack — GIF avatar + neon name glow */
    isNeonVip?: boolean;
    /** Deterministic gold | blue for VIP name styling */
    neonVipGlow?: "gold" | "blue";
    /** Spend-based tier (bronze / silver / gold) for chat, profile, match boost */
    vipTier?: VipTier;
  }
}
