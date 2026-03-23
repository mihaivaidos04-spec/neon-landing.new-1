/** Referral invite copy + deep links (WhatsApp / Telegram / Web Share API). */

export const INVITE_MESSAGE = "Hey, check out NeonLive — join me with this link!";

function referralShareOrigin(): string {
  if (typeof window === "undefined") return "";
  const env = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (env && /^https?:\/\//i.test(env.trim())) {
    return env.trim().replace(/\/+$/, "");
  }
  return window.location.origin;
}

/** Share link uses ?ref=<referralCode> (uuid). Legacy user-id links still resolve in API. */
export function buildInviteShareUrl(referralCode: string): string {
  if (typeof window === "undefined") return "";
  const origin = referralShareOrigin();
  return `${origin}?ref=${encodeURIComponent(referralCode)}`;
}

export function buildInviteShareText(referralCode: string): string {
  const url = buildInviteShareUrl(referralCode);
  return `${INVITE_MESSAGE} ${url}`;
}

export function openWhatsAppInvite(text: string): void {
  if (typeof window === "undefined") return;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openTelegramInvite(text: string): void {
  if (typeof window === "undefined") return;
  const url = `https://t.me/share/url?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Fixed marketing copy for official WhatsApp share (`https://wa.me/?text=…`). */
export const NEONLIVE_WHATSAPP_MARKETING_TEXT =
  "Hai pe NeonLive! Chat video live cu oameni din toată lumea 🎥✨ https://www.neonlive.chat";

export function openNeonLiveMarketingWhatsAppShare(): void {
  if (typeof window === "undefined") return;
  const text = encodeURIComponent(NEONLIVE_WHATSAPP_MARKETING_TEXT);
  window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
}
