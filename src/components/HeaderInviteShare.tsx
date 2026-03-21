"use client";

import { useCallback } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import {
  buildInviteShareText,
  buildInviteShareUrl,
  openTelegramInvite,
  openWhatsAppInvite,
} from "../lib/invite-share";

type Props = {
  locale?: ContentLocale;
  userId: string | null;
};

/** Apple-style frosted pill: system Share + WhatsApp + Telegram — header only */
export default function HeaderInviteShare({ locale = "en", userId }: Props) {
  const t = getContentT(locale);

  const shareText = userId ? buildInviteShareText(userId) : "";
  const shareUrl = userId ? buildInviteShareUrl(userId) : "";

  const handleNativeShare = useCallback(async () => {
    if (!userId || !shareUrl) return;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "NeonLive",
          text: shareText,
          url: shareUrl,
        });
        return;
      }
    } catch {
      /* user cancelled or unsupported */
    }
    openWhatsAppInvite(shareText);
  }, [userId, shareText, shareUrl]);

  if (!userId) return null;

  const btnBase =
    "flex shrink-0 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.08] text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl transition-[transform,background-color,opacity] duration-200 active:scale-[0.94] hover:bg-white/[0.14] hover:border-white/[0.22]";

  return (
    <div
      className="flex shrink-0 items-center gap-1 rounded-full border border-white/[0.12] bg-white/[0.06] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_8px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
      role="group"
      aria-label={t.inviteFriendsBtn}
    >
      <button
        type="button"
        onClick={() => void handleNativeShare()}
        className={`${btnBase} h-9 w-9 sm:h-10 sm:w-10`}
        title="Share"
        aria-label="Share"
      >
        <svg className="h-[18px] w-[18px] sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3v10M12 3l3.5 3.5M12 3L8.5 6.5"
            stroke="currentColor"
            strokeWidth={1.85}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 13.5v4.25A2.25 2.25 0 007.25 20h9.5A2.25 2.25 0 0019 17.75V13.5"
            stroke="currentColor"
            strokeWidth={1.85}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <span className="mx-0.5 hidden h-5 w-px bg-white/15 sm:block" aria-hidden />
      <button
        type="button"
        onClick={() => openWhatsAppInvite(shareText)}
        className={`${btnBase} h-9 w-9 sm:h-10 sm:w-10 text-[#25D366]`}
        title="WhatsApp"
        aria-label="Share via WhatsApp"
      >
        <svg className="h-[18px] w-[18px] sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => openTelegramInvite(shareText)}
        className={`${btnBase} h-9 w-9 sm:h-10 sm:w-10 text-[#2AABEE]`}
        title="Telegram"
        aria-label="Share via Telegram"
      >
        <svg className="h-[18px] w-[18px] sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      </button>
    </div>
  );
}
