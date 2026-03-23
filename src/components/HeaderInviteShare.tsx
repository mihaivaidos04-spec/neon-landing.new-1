"use client";

import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import { openNeonLiveMarketingWhatsAppShare } from "../lib/invite-share";

type Props = {
  locale?: ContentLocale;
  /** Kept for call-site compatibility; marketing share does not use referral. */
  userId?: string | null;
};

function WhatsAppGlyph() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.17 1.535 5.943L.057 23.929l6.188-1.453A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.722.874.936-3.629-.235-.373A9.818 9.818 0 1112 21.818z" />
    </svg>
  );
}

/** Official WhatsApp share (wa.me) — header */
export default function HeaderInviteShare({ locale = "en" }: Props) {
  const t = getContentT(locale);

  return (
    <button
      type="button"
      onClick={openNeonLiveMarketingWhatsAppShare}
      className="flex max-w-[100%] shrink-0 items-center gap-2 rounded-[24px] px-6 py-3 text-sm font-bold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
      style={{ background: "#25D366" }}
      title="WhatsApp"
      aria-label={t.inviteFriendsBtn}
    >
      <WhatsAppGlyph />
      <span className="truncate">WhatsApp</span>
    </button>
  );
}
