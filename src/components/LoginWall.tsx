"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { signIn, getProviders, getSession } from "next-auth/react";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import { getSafeAuthCallbackUrl } from "../lib/auth-callback-url";
import NeonLiveLogo from "./NeonLiveLogo";
import NeonPinkSpinner from "./NeonPinkSpinner";
import NicknameSetupModal from "./NicknameSetupModal";

function normalizeNumericText(input: string): string {
  return input
    .replace(/0️⃣/g, "0")
    .replace(/1️⃣/g, "1")
    .replace(/2️⃣/g, "2")
    .replace(/3️⃣/g, "3")
    .replace(/4️⃣/g, "4")
    .replace(/5️⃣/g, "5")
    .replace(/6️⃣/g, "6")
    .replace(/7️⃣/g, "7")
    .replace(/8️⃣/g, "8")
    .replace(/9️⃣/g, "9")
    .replace(/🔟/g, "10")
    .replace(/\uFE0F/g, "")
    .replace(/⃣/g, "");
}

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
  const firstLoginBonusText = normalizeNumericText(t.firstLoginBonus);
  const [providers, setProviders] = useState<Record<string, { id: string; name: string }> | null>(null);
  const [showOther, setShowOther] = useState(false);
  const [email, setEmail] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendReady, setResendReady] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [tick, setTick] = useState(0);
  const [showNicknameSetup, setShowNicknameSetup] = useState(false);
  const resendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) getProviders().then(setProviders);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setShowOther(false);
      setOtpStep(false);
      setEmailError(null);
      setOtpError(null);
      setResendReady(false);
      setOtpExpiresAt(null);
      setOtpDigits(["", "", "", "", "", ""]);
      setShowNicknameSetup(false);
    }
  }, [open]);

  useEffect(() => {
    if (!otpStep || !otpExpiresAt) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [otpStep, otpExpiresAt]);

  useEffect(() => {
    if (resendTimerRef.current) {
      clearTimeout(resendTimerRef.current);
      resendTimerRef.current = null;
    }
    if (!open || !otpStep) {
      setResendReady(false);
      return;
    }
    setResendReady(false);
    resendTimerRef.current = setTimeout(() => {
      setResendReady(true);
    }, 60_000);
    return () => {
      if (resendTimerRef.current) {
        clearTimeout(resendTimerRef.current);
        resendTimerRef.current = null;
      }
    };
  }, [open, otpStep]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const postAuthUrl = getSafeAuthCallbackUrl("/");

  const isValidEmail = (value: string): boolean => /\S+@\S+\.\S+/.test(value);

  const handleOAuth = async (provider: string) => {
    console.log("Se incearca logarea cu...", provider);
    setLoading(provider);
    try {
      const result = await signIn(provider, { callbackUrl: postAuthUrl, redirect: false });
      if (result?.url) {
        window.location.href = result.url;
        return;
      }
      console.warn(`[login] signIn(${provider}) did not return a redirect URL`);
    } catch (error) {
      console.error(`[login] signIn(${provider}) failed`, error);
    } finally {
      setLoading(null);
    }
  };

  const sendOtpToEmail = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed || !isValidEmail(trimmed)) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    setEmailError(null);
    setOtpError(null);
    setLoading("email");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEmailError(typeof data?.error === "string" ? data.error : "Could not send code");
        return false;
      }
      setOtpStep(true);
      setOtpExpiresAt(Date.now() + 5 * 60 * 1000);
      setOtpDigits(["", "", "", "", "", ""]);
      setResendReady(false);
      requestAnimationFrame(() => otpInputRefs.current[0]?.focus());
      return true;
    } finally {
      setLoading(null);
    }
  }, [email]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendOtpToEmail();
  };

  const handleResendOtp = async () => {
    await sendOtpToEmail();
  };

  const otpExpired = otpExpiresAt != null && Date.now() >= otpExpiresAt;

  const handleOtpDigitChange = (index: number, raw: string) => {
    const d = raw.replace(/\D/g, "").slice(-1);
    setOtpError(null);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = d;
      return next;
    });
    if (d && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const chars = text.split("");
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < chars.length; i++) next[i] = chars[i]!;
    setOtpDigits(next);
    setOtpError(null);
    const focusIdx = Math.min(chars.length, 5);
    otpInputRefs.current[focusIdx]?.focus();
  };

  const handleVerifyOtp = async () => {
    const trimmed = email.trim();
    const code = otpDigits.join("");
    if (!trimmed || code.length !== 6 || otpExpired) return;
    setOtpError(null);
    setLoading("otp-verify");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: trimmed, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOtpError(typeof data?.error === "string" ? data.error : t.emailOtpWrong);
        return;
      }
      const session = await getSession();
      const nn = session?.nickname;
      const needsNickname = nn == null || nn === "";
      if (needsNickname) {
        setShowNicknameSetup(true);
      } else {
        onClose();
        window.location.assign(postAuthUrl);
      }
    } finally {
      setLoading(null);
    }
  };

  const otpRemainingMs =
    otpExpiresAt != null ? Math.max(0, otpExpiresAt - Date.now()) : 0;
  void tick;
  const otpMm = Math.floor(otpRemainingMs / 60000);
  const otpSs = Math.floor((otpRemainingMs % 60000) / 1000);
  const otpTimeStr = `${String(otpMm).padStart(2, "0")}:${String(otpSs).padStart(2, "0")}`;

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
              <p className="number-plain text-base font-bold leading-snug text-fuchsia-200/95 sm:text-lg md:text-xl">
                {firstLoginBonusText}
              </p>
              <p className="text-sm font-medium leading-relaxed text-white/75 sm:text-base md:text-[1.05rem]">
                {t.loginGatewayTagline}
              </p>
            </div>

            <div className="mx-auto mt-6 max-w-md space-y-2 text-center sm:mt-7">
              <p className="text-sm font-semibold tracking-tight text-white/88 sm:text-base">
                Join 10,000+ users worldwide
              </p>
              <p
                className="text-xl leading-none tracking-[0.2em] sm:text-2xl"
                role="img"
                aria-label="Active users in Brazil, United States, India, Germany, Mexico, France, Japan"
              >
                🇧🇷🇺🇸🇮🇳🇩🇪🇲🇽🇫🇷🇯🇵
              </p>
              <p className="text-[11px] font-medium text-white/48 sm:text-xs sm:text-white/50">
                Your data is never sold or shared
              </p>
            </div>

            <div className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3.5 sm:mt-10 sm:gap-4">
              <button
                type="button"
                onClick={() => handleOAuth("discord")}
                disabled={!!loading}
                className="pointer-events-auto relative z-[2] flex min-h-[58px] w-full items-center justify-center gap-3 rounded-2xl bg-[#5865F2] py-4 text-base font-bold text-white shadow-[0_0_32px_rgba(88,101,242,0.55)] transition-all hover:scale-[1.01] hover:bg-[#4752C4] hover:shadow-[0_0_48px_rgba(88,101,242,0.65)] disabled:cursor-not-allowed disabled:opacity-55 active:scale-[0.99] sm:min-h-16 sm:text-lg md:text-xl"
              >
                {loading === "discord" ? (
                  <NeonPinkSpinner label="Connecting…" className="text-white" />
                ) : (
                  <>
                    <DiscordIcon className="h-8 w-8 shrink-0 text-white sm:h-9 sm:w-9" />
                    <span>{t.loginWithDiscord}</span>
                  </>
                )}
              </button>

              {providers?.google && (
                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  disabled={!!loading}
                  className="pointer-events-auto relative z-[2] flex min-h-[58px] w-full items-center justify-center gap-3 rounded-2xl border-2 border-white/30 bg-white py-4 text-base font-bold text-gray-900 shadow-[0_0_32px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.01] hover:bg-gray-50 hover:shadow-[0_0_44px_rgba(66,133,244,0.35)] disabled:cursor-not-allowed disabled:opacity-55 active:scale-[0.99] sm:min-h-16 sm:text-lg md:text-xl"
                >
                  {loading === "google" ? (
                    <NeonPinkSpinner label="Connecting…" labelClassName="text-gray-800" />
                  ) : (
                    <>
                      <GoogleIcon className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
                      <span>{t.loginWithGoogle}</span>
                    </>
                  )}
                </button>
              )}

              {providers?.facebook && (
                <button
                  type="button"
                  onClick={() => handleOAuth("facebook")}
                  disabled={!!loading}
                  className="pointer-events-auto relative z-[2] flex min-h-[58px] w-full items-center justify-center gap-3 rounded-2xl bg-[#1877F2] py-4 text-base font-bold text-white shadow-[0_0_32px_rgba(24,119,242,0.5)] transition-all hover:scale-[1.01] hover:bg-[#166fe5] hover:shadow-[0_0_48px_rgba(24,119,242,0.6)] disabled:cursor-not-allowed disabled:opacity-55 active:scale-[0.99] sm:min-h-16 sm:text-lg md:text-xl"
                >
                  {loading === "facebook" ? (
                    <NeonPinkSpinner label="Connecting…" className="text-white" />
                  ) : (
                    <>
                      <FacebookIcon className="h-8 w-8 shrink-0 text-white sm:h-9 sm:w-9" />
                      <span>{t.loginWithFacebook}</span>
                    </>
                  )}
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
                <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
                  {!otpStep ? (
                    <>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) setEmailError(null);
                        }}
                        placeholder={t.emailPlaceholder}
                        className="min-h-[52px] rounded-2xl border border-white/15 bg-black/60 px-4 py-3 text-base text-white placeholder:text-white/35 focus:border-fuchsia-500/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/25"
                      />
                      {emailError && (
                        <p className="text-center text-xs text-rose-300/95 sm:text-sm">{emailError}</p>
                      )}
                      <p className="text-center text-xs text-white/45 sm:text-sm">{t.emailNoPasswordNeeded}</p>
                      <button
                        type="submit"
                        disabled={!!loading || !email.trim()}
                        aria-busy={loading === "email"}
                        className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-bold text-white transition-opacity disabled:opacity-45"
                        style={{ background: "linear-gradient(135deg, #db2777 0%, #a855f7 50%, #c026d3 100%)" }}
                      >
                        {loading === "email" ? (
                          <NeonPinkSpinner label="Sending..." className="text-white" />
                        ) : (
                          t.emailSendOtp
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-center text-sm text-fuchsia-100/90">{t.emailOtpSent}</p>
                      <p className="text-center text-xs text-white/50">
                        {t.emailOtpExpiresIn}{" "}
                        <span className="font-mono tabular-nums text-fuchsia-200/90">{otpTimeStr}</span>
                      </p>
                      <p className="text-center text-[11px] text-white/40">{t.emailOtpHint}</p>
                      <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                        {otpDigits.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => {
                              otpInputRefs.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            disabled={otpExpired}
                            className="h-12 w-10 rounded-xl border border-white/20 bg-black/50 text-center text-lg font-semibold text-white focus:border-fuchsia-500/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/25 disabled:opacity-40"
                          />
                        ))}
                      </div>
                      {otpError && (
                        <p className="text-center text-xs font-medium text-rose-400">{otpError}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleVerifyOtp()}
                        disabled={
                          !!loading || otpDigits.join("").length !== 6 || otpExpired
                        }
                        className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-bold text-white transition-opacity disabled:opacity-45"
                        style={{ background: "linear-gradient(135deg, #db2777 0%, #a855f7 50%, #c026d3 100%)" }}
                      >
                        {loading === "otp-verify" ? (
                          <NeonPinkSpinner label="…" className="text-white" />
                        ) : (
                          t.emailVerifyOtp
                        )}
                      </button>
                      <p className="text-center text-xs text-amber-200/85">
                        Check your Spam folder if you don&apos;t see the email.
                      </p>
                      {resendReady && (
                        <button
                          type="button"
                          onClick={() => void handleResendOtp()}
                          disabled={!!loading}
                          className="min-h-[48px] rounded-2xl border border-fuchsia-400/40 bg-fuchsia-950/35 px-4 py-2.5 text-sm font-semibold text-fuchsia-100 transition-all hover:bg-fuchsia-900/45 disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          {loading === "email" ? "Sending again…" : t.emailResendOtp}
                        </button>
                      )}
                    </>
                  )}
                </form>

                {providers?.reddit && (
                  <button
                    type="button"
                    onClick={() => handleOAuth("reddit")}
                    disabled={!!loading}
                    className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-orange-500/45 bg-orange-500/15 py-3.5 text-base font-semibold text-orange-100 transition-opacity hover:bg-orange-500/25 disabled:opacity-50"
                  >
                    {loading === "reddit" ? (
                      <NeonPinkSpinner label="Connecting…" className="text-orange-100" />
                    ) : (
                      t.loginWithReddit
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <NicknameSetupModal
        locale={locale}
        open={showNicknameSetup}
        onSuccess={() => {
          void (async () => {
            try {
              const res = await fetch("/api/user/welcome-bonus", { method: "POST", credentials: "include" });
              const data = (await res.json().catch(() => ({}))) as { granted?: boolean };
              if (res.ok && data.granted) {
                try {
                  sessionStorage.setItem("neon-welcome-bonus-pending", "1");
                } catch {
                  /* ignore */
                }
              }
            } catch {
              /* ignore */
            }
            setShowNicknameSetup(false);
            onClose();
            window.location.assign(postAuthUrl);
          })();
        }}
      />
    </>
  );
}
