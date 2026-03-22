const GUEST_ID_KEY = "neon_guest_id";
const GUEST_ALIAS_KEY = "neon_guest_alias";

function randomDigits(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

export function getOrCreateGuestAlias(): string {
  if (typeof window === "undefined") return `Guest_${randomDigits(3)}`;

  const existingAlias = window.localStorage.getItem(GUEST_ALIAS_KEY);
  if (existingAlias) return existingAlias;

  const alias = `Guest_${randomDigits(3)}`;
  const id = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  window.localStorage.setItem(GUEST_ALIAS_KEY, alias);
  window.localStorage.setItem(GUEST_ID_KEY, id);

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `neon_guest=1; Path=/; SameSite=Lax${secure}`;

  return alias;
}
