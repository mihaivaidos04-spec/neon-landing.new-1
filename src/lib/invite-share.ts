/** Referral invite copy + deep links (WhatsApp / Telegram / Web Share API). */

export const INVITE_MESSAGE = "Hey, check out NeonLive, I just got 10 free coins!";

export function buildInviteShareUrl(userId: string): string {
  if (typeof window === "undefined") return "";
  const origin = window.location.origin;
  return `${origin}?ref=${encodeURIComponent(userId)}`;
}

export function buildInviteShareText(userId: string): string {
  const url = buildInviteShareUrl(userId);
  return `${INVITE_MESSAGE} ${url}`;
}

export function openWhatsAppInvite(text: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openTelegramInvite(text: string): void {
  const url = `https://t.me/share/url?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
