"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Metrics = {
  totalUsers: number;
  totalReferrals: number;
  utmTable: { source: string; count: number }[];
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
        <div className="rounded-lg border border-red-500/50 bg-red-950/20 px-6 py-4 text-red-300">{error}</div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold">Admin Metrics</h1>

        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">Total Users</p>
            <p className="mt-1 text-3xl font-bold">{metrics.totalUsers}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">Total Referrals</p>
            <p className="mt-1 text-3xl font-bold">{metrics.totalReferrals}</p>
          </div>
        </div>

        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold">UTM sources</h2>
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
      </div>
    </div>
  );
}
