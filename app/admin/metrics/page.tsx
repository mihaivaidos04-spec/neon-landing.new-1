"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Metrics = {
  totalUsers: number;
  totalReferrals: number;
  totalTestRevenue: number;
  totalTestRevenueCents: number;
  utmTable: { source: string; count: number }[];
  paymentLog: {
    id: string;
    eventType: string;
    paymentIntentId: string | null;
    amountCents: number | null;
    currency: string | null;
    status: string | null;
    livemode: boolean;
    errorMessage: string | null;
    createdAt: string;
  }[];
};

export default function AdminMetricsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/admin/metrics")
      .then((res) => {
        if (res.status === 403) {
          setError("Access denied. You are not an admin.");
          return null;
        }
        if (!res.ok) throw new Error("Failed to fetch metrics");
        return res.json();
      })
      .then((data) => {
        if (data) setMetrics(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status, router]);

  useEffect(() => {
    if (!metrics || status !== "authenticated") return;
    const id = setInterval(
      () =>
        fetch("/api/admin/metrics")
          .then((r) => r.json())
          .then(setMetrics)
          .catch(() => {}),
      10000
    );
    return () => clearInterval(id);
  }, [metrics, status]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <span className="animate-pulse">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="rounded-lg border border-red-500/50 bg-red-950/20 px-6 py-4 text-red-300">
          {error}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold">Admin Metrics</h1>

        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">Total Users</p>
            <p className="mt-1 text-3xl font-bold">{metrics.totalUsers}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">Total Referrals</p>
            <p className="mt-1 text-3xl font-bold">{metrics.totalReferrals}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">Total Test Revenue</p>
            <p className="mt-1 text-3xl font-bold">${metrics.totalTestRevenue.toFixed(2)}</p>
          </div>
        </div>

        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold">Most Effective UTM Source</h2>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/80">Source</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-white/80">Signups</th>
                </tr>
              </thead>
              <tbody>
                {metrics.utmTable.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-white/50">
                      No UTM data yet
                    </td>
                  </tr>
                ) : (
                  metrics.utmTable.map((row) => (
                    <tr key={row.source} className="border-b border-white/5">
                      <td className="px-4 py-3 font-medium">{row.source}</td>
                      <td className="px-4 py-3 text-right">{row.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Payment Intent Log (real-time)</h2>
          <p className="mb-4 text-sm text-white/50">
            Last 100 events · Refreshes every 10s · Includes failed & test mode
          </p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/80">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/80">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/80">Payment Intent</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/80">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/80">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/80">Mode</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/80">Error</th>
                </tr>
              </thead>
              <tbody>
                {metrics.paymentLog.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-white/50">
                      No payment events yet. Configure payment webhook (e.g. Lemon Squeezy) to log events.
                    </td>
                  </tr>
                ) : (
                  metrics.paymentLog.map((r) => (
                    <tr key={r.id} className="border-b border-white/5">
                      <td className="whitespace-nowrap px-4 py-2 text-xs text-white/70">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-xs font-mono">{r.eventType}</td>
                      <td className="max-w-[120px] truncate px-4 py-2 text-xs font-mono text-white/70">
                        {r.paymentIntentId ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-right text-xs">
                        {r.amountCents != null ? `$${(r.amountCents / 100).toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            r.status === "succeeded"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : r.status === "requires_payment_method" || r.status === "requires_action"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {r.status ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {r.livemode ? (
                          <span className="text-emerald-400">Live</span>
                        ) : (
                          <span className="text-amber-400">Test</span>
                        )}
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-2 text-xs text-red-400">
                        {r.errorMessage ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
