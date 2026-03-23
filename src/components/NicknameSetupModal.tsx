"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type { ContentLocale } from "@/src/lib/content-i18n";

type Props = {
  locale?: ContentLocale;
  /** When true, user cannot dismiss without saving a valid nickname */
  open: boolean;
  onSuccess?: () => void;
};

export default function NicknameSetupModal({ locale = "en", open, onSuccess }: Props) {
  const { update } = useSession();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/user/nickname", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Could not save nickname");
        return;
      }
      await update();
      toast.success(locale === "ro" ? "Poreclă salvată" : "Nickname saved");
      window.setTimeout(() => {
        toast(
          locale === "ro"
            ? "NeonLive are traducere AI live — vorbește cu oricine în limba ta. Primele 5 minute gratis!"
            : "NeonLive has live AI translation — talk to anyone in your language. First 5 minutes free!",
          { icon: "💡", duration: 6500 }
        );
      }, 450);
      onSuccess?.();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }, [value, update, locale, onSuccess]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/92 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nickname-setup-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-fuchsia-500/35 bg-[#0a0a0f] p-6 shadow-[0_0_40px_rgba(168,85,247,0.25)]">
        <h2 id="nickname-setup-title" className="text-lg font-bold text-white">
          {locale === "ro" ? "Alege-ți porecla" : "Choose your nickname"}
        </h2>
        <p className="mt-2 text-sm text-white/65">
          {locale === "ro"
            ? "Vei apărea așa în chat video. 3–20 caractere: litere, cifre și underscore (_). Trebuie să fie unică."
            : "This is how you appear in video chat. 3–20 characters: letters, numbers, and underscores only. Must be unique."}
        </p>
        <label className="mt-4 block text-xs font-medium text-white/50" htmlFor="nickname-setup-input">
          {locale === "ro" ? "Poreclă" : "Nickname"}
        </label>
        <input
          id="nickname-setup-input"
          type="text"
          autoComplete="username"
          maxLength={20}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void save();
          }}
          className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-white outline-none ring-fuchsia-500/40 focus:border-fuchsia-500/50 focus:ring-2"
          placeholder={locale === "ro" ? "ex: NeonStar_99" : "e.g. NeonStar_99"}
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <button
          type="button"
          disabled={saving || value.trim().length < 3}
          onClick={() => void save()}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving
            ? locale === "ro"
              ? "Se salvează…"
              : "Saving…"
            : locale === "ro"
              ? "Continuă"
              : "Continue"}
        </button>
      </div>
    </div>
  );
}
