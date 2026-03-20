/** Cookie name — must match server-readable client cookie */
export const AGE_VERIFIED_COOKIE_NAME = "age_verified";

/** 30 days in seconds */
export const AGE_VERIFIED_MAX_AGE_SEC = 30 * 24 * 60 * 60;

export function readAgeVerifiedFromDocument(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${AGE_VERIFIED_COOKIE_NAME}=true`));
}

/** Sets HttpOnly=false cookie for 30 days (landing age gate). */
export function setAgeVerifiedCookie(): void {
  if (typeof document === "undefined") return;
  const parts = [
    `${AGE_VERIFIED_COOKIE_NAME}=true`,
    `Max-Age=${AGE_VERIFIED_MAX_AGE_SEC}`,
    "Path=/",
    "SameSite=Lax",
  ];
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    parts.push("Secure");
  }
  document.cookie = parts.join("; ");
}
