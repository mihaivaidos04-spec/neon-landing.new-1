import type { DefaultSession } from "next-auth";

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
  }
}
