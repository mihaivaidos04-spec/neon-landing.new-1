/**
 * Canonical public site origin (no trailing slash).
 * Used for Stripe success/cancel URLs, metadata, sitemap — and should match
 * Google OAuth redirect host (see AUTH_URL / NEXTAUTH_URL on the server).
 */
export const DEFAULT_PUBLIC_SITE_ORIGIN = "https://www.neonchat.live";

/**
 * Resolve the live site URL. Prefer env in production; falls back to neonchat.live default (not localhost).
 */
export function getPublicSiteOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    DEFAULT_PUBLIC_SITE_ORIGIN;
  return String(raw).trim().replace(/\/+$/, "");
}
