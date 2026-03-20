/**
 * Best-effort country from edge headers (Vercel, Cloudflare, CloudFront, Fastly).
 */
export function countryFromEdgeHeaders(headers: Headers): string | null {
  const candidates = [
    headers.get("x-vercel-ip-country"),
    headers.get("cf-ipcountry"),
    headers.get("cloudfront-viewer-country"),
    headers.get("fastly-client-geo-country-code"),
    headers.get("x-country-code"),
  ];
  for (const c of candidates) {
    if (c && /^[a-z]{2}$/i.test(c.trim())) {
      return c.trim().toUpperCase();
    }
  }
  return null;
}

export function getClientIp(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return null;
}

function isNonPublicIp(ip: string): boolean {
  return (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("fc") ||
    ip.startsWith("fe80:")
  );
}

/** ipapi.co — HTTPS, free tier; try before ip-api.com. */
async function countryFromIpapiCo(ip: string): Promise<string | null> {
  if (isNonPublicIp(ip)) return null;
  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/country_code/`, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(4000),
      headers: { Accept: "text/plain", "User-Agent": "neon-live/1.0" },
    });
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    if (/^[A-Za-z]{2}$/.test(text)) return text.toUpperCase();
  } catch {
    /* ignore */
  }
  return null;
}

/** ip-api.com — free tier, no key; fallback when ipapi fails. */
async function countryFromIpApiCom(ip: string): Promise<string | null> {
  if (isNonPublicIp(ip)) return null;
  try {
    const ac = new AbortController();
    const tid = setTimeout(() => ac.abort(), 4000);
    let res: Response;
    try {
      res = await fetch(
        `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode`,
        { next: { revalidate: 0 }, signal: ac.signal }
      );
    } finally {
      clearTimeout(tid);
    }
    if (!res.ok) return null;
    const j = (await res.json()) as { status?: string; countryCode?: string };
    if (j.status === "success" && j.countryCode && /^[A-Z]{2}$/.test(j.countryCode)) {
      return j.countryCode;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Geo-IP chain: ipapi.co then ip-api.com. */
export async function countryFromIpLookup(ip: string): Promise<string | null> {
  const a = await countryFromIpapiCo(ip);
  if (a) return a;
  return countryFromIpApiCom(ip);
}

/** Edge headers, then client IP lookup. */
export async function resolveCountryFromRequestHeaders(headers: Headers): Promise<string | null> {
  const edge = countryFromEdgeHeaders(headers);
  if (edge) return edge;
  const ip = getClientIp(headers);
  if (!ip) return null;
  return countryFromIpLookup(ip);
}
