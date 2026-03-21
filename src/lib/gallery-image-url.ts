const MAX_HTTPS_LEN = 500_000;
const MAX_DATA_URL_LEN = 600_000;

const DATA_URL_RE = /^data:image\/(jpeg|png|webp);base64,/i;

/**
 * Accepts HTTPS image URLs or small base64 data URLs (jpeg/png/webp) for profile gallery.
 */
export function sanitizeGalleryImageUrl(raw: unknown): string | null {
  if (raw == null || typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  if (s.length > MAX_DATA_URL_LEN) return null;

  if (DATA_URL_RE.test(s)) {
    return s;
  }

  if (s.length > MAX_HTTPS_LEN) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") return null;
    return s;
  } catch {
    return null;
  }
}
