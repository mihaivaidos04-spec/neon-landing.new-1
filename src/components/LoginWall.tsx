"use client";

import { useState, useEffect } from "react";
import { signIn, getProviders } from "next-auth/react";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import NeonLiveLogo from "./NeonLiveLogo";

/** Official Google "G" logo – multicolor per brand guidelines */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

/** Official Facebook logo */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/** Discord brand mark (simplified) */
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  locale: ContentLocale;
};

/**
 * Single immersive “gateway” for all sign-in — heavy blur, neon love border, Great Vibes wordmark.
 */
export default function LoginWall({ open, onClose, locale }: Props) {
  const t = getContentT(locale);
  const [providers, setProviders] = useState<Record<string, { id: string; name: string }> | null>(null);
  const [showOther, setShowOther] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (open) getProviders().then(setProviders);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setShowOther(false);
      setEmailSent(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleOAuth = (provider: string) => {
    setLoading(provider);
    signIn(provider, { callbackUrl: window.location.href }).finally(() => setLoading(null));
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading("email");
    try {
      await signIn("email", { email: email.trim(), callbackUrl: window.location.href });
      setEmailSent(true);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      {/* Full-viewport veil — world falls away */}
      <div
        className="fixed inset-0 z-[500] bg-black/55 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:backdrop-blur-2xl"
        style={{ WebkitBackdropFilter: "blur(22px)" }}
        aria-hidden
        onClick={onClose}
      />

      <div
        className="fixed inset-0 z-[510] flex items-center justify-center p-2 sm:p-4 md:p-6 pointer-events-none"
        role="presentation"
      >
        <div
          className="login-gateway-outer login-gateway-modal-animate pointer-events-auto w-full max-w-[min(36rem,calc(100vw-0.75rem))] max-h-[min(94dvh,920px)] overflow-y-auto overscroll-contain shadow-[0_25px_80px_-12px_rgba(0,0,0,0.85)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-gateway-logo"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="login-gateway-inner relative px-5 pb-8 pt-10 sm:px-8 sm:pb-10 sm:pt-12 md:px-10 md:pb-12 md:pt-14">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl leading-none text-white/50 transition-all hover:border-fuchsia-500/30 hover:bg-white/10 hover:text-white sm:right-4 sm:top-4"
              aria-label="Close"
            >
              ×
            </button>

            <span className="sr-only">{t.loginWallTitle}</span>

            <div className="login-gateway-logo-wrap flex flex-col items-center justify-center px-2">
              <NeonLiveLogo variant="gateway" as="h2" id="login-gateway-logo" className="justify-center" />
            </div>

            <div className="mx-auto mt-6 max-w-md space-y-1.5 text-center sm:mt-8">
              <p className="text-base font-bold leading-snug text-fuchsia-200/95 sm:text-lg md:text-xl">
                {t.firstLoginBonus}
              </p>
              <p className="text-sm font-medium leading-relaxed text-white/75 sm:text-base md:text-[1.05rem]">
                {t.loginGatewayTagline}
              </p>
            </div>

            <div className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3.5 sm:mt-10 sm:gap-4">
              {providers?.google && (
                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  disabled={!!loading}
                  className="flex min-h-[58px] w-full items-center justify-center gap-3 rounded-2xl border-2 border-white/30 bg-white py-4 text-base font-bold text-gray-900 shadow-[0_0_32px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.01] hover:bg-gray-50 hover:shadow-[0_0_44px_rgba(66,133,244,0.35)] disabled:cursor-not-allowed disabled:opacity-55 active:scale-[0.99] sm:min-h-16 sm:text-lg md:text-xl"
                >
                  <GoogleIcon className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
                  <span>{t.loginWithGoogle}</span>
                </button>
              )}

              {providers?.facebook && (
                <button
                  type="button"
                  onClick={() => handleOAuth("facebook")}
                  disabled={!!loading}
                  className="flex min-h-[58px] w-full items-center justify-center gap-3 rounded-2xl bg-[#1877F2] py-4 text-base font-bold text-white shadow-[0_0_32px_rgba(24,119,242,0.5)] transition-all hover:scale-[1.01] hover:bg-[#166fe5] hover:shadow-[0_0_48px_rgba(24,119,242,0.6)] disabled:cursor-not-allowed disabled:opacity-55 active:scale-[0.99] sm:min-h-16 sm:text-lg md:text-xl"
                >
                  <FacebookIcon className="h-8 w-8 shrink-0 text-white sm:h-9 sm:w-9" />
                  <span>{t.loginWithFacebook}</span>
                </button>
              )}

              {providers?.discord && (
                <button
                  type="button"
                  onClick={() => handleOAuth("discord")}
                  disabled={!!loading}
                  className="flex min-h-[58px] w-full items-center justify-center gap-3 rounded-2xl bg-[#5865F2] py-4 text-base font-bold text-white shadow-[0_0_32px_rgba(88,101,242,0.55)] transition-all hover:scale-[1.01] hover:bg-[#4752C4] hover:shadow-[0_0_48px_rgba(88,101,242,0.65)] disabled:cursor-not-allowed disabled:opacity-55 active:scale-[0.99] sm:min-h-16 sm:text-lg md:text-xl"
                >
                  <DiscordIcon className="h-8 w-8 shrink-0 text-white sm:h-9 sm:w-9" />
                  <span>{t.loginWithDiscord}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowOther((o) => !o)}
              className="mx-auto mt-6 flex min-h-[48px] w-full max-w-md items-center justify-center gap-2 rounded-2xl border border-fuchsia-500/25 bg-gradient-to-r from-fuchsia-950/40 via-violet-950/30 to-fuchsia-950/40 px-4 text-sm font-semibold text-fuchsia-100/90 transition-all hover:border-fuchsia-400/40 hover:from-fuchsia-900/50 hover:to-violet-900/40 sm:mt-8 sm:min-h-[52px] sm:text-base"
              aria-expanded={showOther}
            >
              <span className="text-fuchsia-300">{showOther ? "▲" : "▼"}</span>
              {t.otherMethods}
            </button>

            {showOther && (
              <div className="mx-auto mt-5 w-full max-w-md space-y-4 border-t border-fuchsia-500/20 pt-6">
                <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="min-h-[52px] rounded-2xl border border-white/15 bg-black/60 px-4 py-3 text-base text-white placeholder:text-white/35 focus:border-fuchsia-500/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/25"
                  />
                  <p className="text-center text-xs text-white/45 sm:text-sm">{t.emailNoPasswordNeeded}</p>
                  <button
                    type="submit"
                    disabled={!!loading || !email.trim()}
                    className="min-h-[52px] rounded-2xl py-3.5 text-base font-bold text-white transition-opacity disabled:opacity-45"
                    style={{ background: "linear-gradient(135deg, #db2777 0%, #a855f7 50%, #c026d3 100%)" }}
                  >
                    {emailSent ? t.emailLinkSent : t.emailProceed}
                  </button>
                </form>

                {providers?.reddit && (
                  <button
                    type="button"
                    onClick={() => handleOAuth("reddit")}
                    disabled={!!loading}
                    className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-orange-500/45 bg-orange-500/15 py-3.5 text-base font-semibold text-orange-100 transition-opacity hover:bg-orange-500/25 disabled:opacity-50"
                  >
                    {t.loginWithReddit}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
