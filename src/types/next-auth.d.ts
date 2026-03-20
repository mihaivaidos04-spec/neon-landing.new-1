import "next-auth";

declare module "next-auth" {
  interface Session {
    userId?: string;
    tier?: string;
    coins?: number;
    isGhost?: boolean;
    xp?: number;
    currentLevel?: number;
    /** ISO 3166-1 alpha-2 from User.country (IP or manual) */
    countryCode?: string | null;
  }
}
