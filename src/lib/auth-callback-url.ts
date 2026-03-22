export function getSafeAuthCallbackUrl(fallbackPath = "/"): string {
  if (typeof window === "undefined") return fallbackPath;

  const current = new URL(window.location.href);
  const rawNested = current.searchParams.get("callbackUrl");

  if (rawNested) {
    try {
      const decoded = decodeURIComponent(rawNested);
      const nested = new URL(decoded, current.origin);
      nested.searchParams.delete("callbackUrl");
      if (nested.pathname !== "/login" && !nested.pathname.startsWith("/api/auth")) {
        return `${nested.origin}${nested.pathname}${nested.search}${nested.hash}`;
      }
    } catch {
      // ignore malformed callbackUrl and fallback to normalized current URL
    }
  }

  if (current.pathname === "/login" || current.pathname.startsWith("/api/auth")) {
    return `${current.origin}${fallbackPath}`;
  }

  current.searchParams.delete("callbackUrl");
  return `${current.origin}${current.pathname}${current.search}${current.hash}`;
}
