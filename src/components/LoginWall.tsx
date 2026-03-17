"use client";

import { useState, useEffect } from "react";
import { signIn, getProviders } from "next-auth/react";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";

const NEON_VIOLET = "#8b5cf6";

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

/** Official Apple logo – silhouette */
function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

/** Official Snapchat ghost logo */
function SnapchatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.69-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.375-.135-.552-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.052-.224-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z" />
    </svg>
  );
}

const AUTH_BUTTON_BASE =
  "flex w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/[0.06] py-3.5 text-base font-medium text-white backdrop-blur-sm transition-all duration-200 disabled:opacity-60";

type Props = {
  open: boolean;
  onClose: () => void;
  locale: ContentLocale;
};

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
      <div
        className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="modal-neon fixed left-1/2 top-1/2 z-[310] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 px-6 py-8 shadow-2xl"
        style={{ boxShadow: `0 0 60px ${NEON_VIOLET}40` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-wall-title"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 id="login-wall-title" className="text-xl font-semibold text-white">
            {t.loginWallTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="mb-6 text-center text-sm text-emerald-400/90">
          {t.firstLoginBonus}
        </p>

        {/* OAuth providers – Google mereu vizibil; celelalte doar dacă configurate */}
        <div className="space-y-3">
          {providers?.apple && (
            <button
              type="button"
              onClick={() => handleOAuth("apple")}
              disabled={!!loading}
              className={`${AUTH_BUTTON_BASE} hover:border-white/30 hover:bg-white/10 hover:shadow-[0_0_24px_rgba(255,255,255,0.15)]`}
            >
              <AppleIcon className="h-5 w-5 shrink-0 text-white" />
              <span className="text-center">{t.loginWithApple}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={!!loading || !providers?.google}
            className={`${AUTH_BUTTON_BASE} hover:border-[#4285F4]/50 hover:bg-[#4285F4]/10 hover:shadow-[0_0_24px_rgba(66,133,244,0.35)] disabled:opacity-60`}
          >
            <GoogleIcon className="h-5 w-5 shrink-0" />
            <span className="text-center">{t.loginWithGoogle}</span>
          </button>
          {providers?.snapchat && (
            <button
              type="button"
              onClick={() => handleOAuth("snapchat")}
              disabled={!!loading}
              className={`${AUTH_BUTTON_BASE} text-[#FFFC00] hover:border-[#FFFC00]/50 hover:bg-[#FFFC00]/10 hover:shadow-[0_0_24px_rgba(255,252,0,0.35)]`}
            >
              <SnapchatIcon className="h-5 w-5 shrink-0" />
              <span className="text-center">{t.loginWithSnapchat}</span>
            </button>
          )}
        </div>

        {/* Alte metode */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowOther((o) => !o)}
            className="w-full rounded-full border border-white/15 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
          >
            {t.otherMethods} {showOther ? "▲" : "▼"}
          </button>

          {showOther && (
            <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
              <form onSubmit={handleMagicLink} className="flex flex-col gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40"
                />
                <button
                  type="submit"
                  disabled={!!loading || !email.trim()}
                  className="rounded-full py-2.5 text-sm font-semibold text-[#8b5cf6] transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {emailSent ? "✓ Link trimis" : t.emailProceed}
                </button>
              </form>
              {providers?.reddit && (
                <button
                  type="button"
                  onClick={() => handleOAuth("reddit")}
                  disabled={!!loading}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 py-2.5 text-sm font-semibold text-orange-300 transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {t.loginWithReddit}
                </button>
              )}
              <button
                type="button"
                disabled
                className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 text-sm text-white/50"
              >
                {t.loginWithPhone} (în curând)
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
