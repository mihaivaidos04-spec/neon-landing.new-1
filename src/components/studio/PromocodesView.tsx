"use client";

import { useState } from "react";
import { getT } from "@/src/i18n";
import { useStudioLocale } from "@/src/components/studio/StudioLocaleContext";
import toast from "react-hot-toast";

type Promocode = {
  id: string;
  code: string;
  bonusPercent: number;
  usedCount: number;
  createdAt: string;
};

type Props = { promocodes: Promocode[]; locale?: "en" | "ar" | "id" };

export default function PromocodesView({ promocodes: initial, locale: localeProp }: Props) {
  const localeFromContext = useStudioLocale();
  const locale = localeProp ?? localeFromContext;
  const t = getT(locale);
  const [promocodes, setPromocodes] = useState(initial);
  const [code, setCode] = useState("");
  const [bonusPercent, setBonusPercent] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const trimmed = code.toUpperCase().replace(/\s/g, "");
    if (!trimmed || trimmed.length < 4) {
      toast.error("Code must be at least 4 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/studio/promocodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed, bonusPercent }),
      });
      const data = await res.json();
      if (res.ok) {
        setPromocodes((p) => [data.promocode, ...p]);
        setCode("");
        toast.success("Promocode created!");
      } else {
        toast.error(data.error ?? "Failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">{t("studio.promocodes")}</h1>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">{t("studio.createCode")}</h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          <input
            type="text"
            placeholder={t("studio.code")}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder:text-white/40"
          />
          <input
            type="number"
            placeholder={t("studio.bonusPercent")}
            value={bonusPercent}
            onChange={(e) => setBonusPercent(parseInt(e.target.value, 10) || 10)}
            min={5}
            max={50}
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="min-h-[44px] rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
          >
            {loading ? t("common.loading") : t("studio.createCode")}
          </button>
        </div>
        <p className="mt-2 text-xs text-white/50">e.g. CHOOX10 for 10% bonus on first coin purchase</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">{t("studio.yourCodes")}</h2>
        {promocodes.length === 0 ? (
          <p className="text-white/50">{t("studio.noPromocodesYet")}</p>
        ) : (
          <ul className="space-y-3">
            {promocodes.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3"
              >
                <span className="font-mono font-semibold text-violet-400">{p.code}</span>
                <span className="text-sm text-white/70">
                  {p.bonusPercent}% bonus · {t("studio.usedCount")}: {p.usedCount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
