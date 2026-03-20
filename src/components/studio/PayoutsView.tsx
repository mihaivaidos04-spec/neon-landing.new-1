"use client";

import { useState } from "react";
import { getT } from "@/src/i18n";
import { useStudioLocale } from "@/src/components/studio/StudioLocaleContext";

type Payout = {
  id: string;
  amountEur: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
};

type Props = {
  pendingBalance: number;
  canRequestPayout: boolean;
  minPayout: number;
  payouts: Payout[];
  locale?: "en" | "ar" | "id";
};

export default function PayoutsView({
  pendingBalance,
  canRequestPayout,
  minPayout,
  payouts,
  locale: localeProp,
}: Props) {
  const localeFromContext = useStudioLocale();
  const locale = localeProp ?? localeFromContext;
  const t = getT(locale);
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/studio/payouts/request", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">{t("studio.payouts")}</h1>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">{t("studio.pendingBalance")}</h2>
        <p className="text-3xl font-bold text-violet-400">€{pendingBalance.toFixed(2)}</p>
        <button
          type="button"
          onClick={handleRequest}
          disabled={!canRequestPayout || loading}
          className="mt-4 min-h-[44px] rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? t("common.loading") : t("studio.requestPayout")} ({t("studio.minPayout")})
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">{t("studio.historicalPayouts")}</h2>
        {payouts.length === 0 ? (
          <p className="text-white/50">{t("studio.noPayoutsYet")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-2 text-left text-sm text-white/80">Date</th>
                  <th className="px-4 py-2 text-left text-sm text-white/80">Amount</th>
                  <th className="px-4 py-2 text-left text-sm text-white/80">Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-b border-white/5">
                    <td className="px-4 py-2 text-sm text-white/90">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 font-medium text-white">€{p.amountEur.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          p.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : p.status === "pending"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
