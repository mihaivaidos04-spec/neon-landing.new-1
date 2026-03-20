"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Metrics = {
  totalUsers: number;
  totalCoinsInCirculation?: number;
  revenueThisMonth?: number;
  totalReferrals: number;
  totalTestRevenue: number;
  totalCoinsSold?: number;
};

type Health = { dbConnected: boolean; logs: { id: number; message: string; level: string; timestamp: string }[] };

type UserRow = { id: string; name: string | null; email: string | null; coins: number; tier: string; createdAt: string };
type GrowthPoint = { date: string; count: number };

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [growth, setGrowth] = useState<GrowthPoint[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [banning, setBanning] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status !== "authenticated") return;

    const load = async () => {
      try {
        const [mRes, hRes, uRes, gRes] = await Promise.all([
          fetch("/api/admin/metrics"),
          fetch("/api/admin/health"),
          fetch(`/api/admin/users?search=${encodeURIComponent(search)}`),
          fetch("/api/admin/user-growth"),
        ]);
        if (mRes.ok) setMetrics(await mRes.json());
        if (hRes.ok) setHealth(await hRes.json());
        if (uRes.ok) {
          const u = await uRes.json();
          setUsers(u.users ?? []);
        }
        if (gRes.ok) {
          const g = await gRes.json();
          setGrowth(g.data ?? []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [status, router, search]);

  const handleAdjustCoins = async (userId: string, delta: number) => {
    setAdjusting(userId);
    try {
      const res = await fetch("/api/admin/users/adjust-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, delta }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, coins: data.newBalance } : u))
        );
      } else {
        alert(data.error ?? "Failed");
      }
    } finally {
      setAdjusting(null);
    }
  };

  const handleBan = async (userId: string) => {
    if (!confirm("Ban this user?")) return;
    setBanning(userId);
    try {
      const res = await fetch("/api/admin/users/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, tier: "BANNED" } : u)));
      } else {
        alert("Failed to ban");
      }
    } finally {
      setBanning(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <span className="animate-pulse">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-4">
            <Link href="/admin/metrics" className="text-violet-400 hover:underline">
              Metrics
            </Link>
            <Link href="/admin/reports" className="text-violet-400 hover:underline">
              Reports
            </Link>
            <Link href="/" className="text-white/60 hover:text-white">
              ← Back
            </Link>
          </div>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">Total Users</p>
            <p className="mt-1 text-3xl font-bold">{metrics?.totalUsers ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">Total Coins in Circulation</p>
            <p className="mt-1 text-3xl font-bold">{(metrics?.totalCoinsInCirculation ?? metrics?.totalCoinsSold ?? 0).toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">Revenue This Month</p>
            <p className="mt-1 text-3xl font-bold">${((metrics?.revenueThisMonth ?? 0)).toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">Total Referrals</p>
            <p className="mt-1 text-3xl font-bold">{metrics?.totalReferrals ?? 0}</p>
          </div>
        </div>

        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold">User Registration Growth (Last 30 Days)</h2>
          <div className="h-64 rounded-xl border border-white/10 bg-white/5 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growth}>
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                <YAxis stroke="#9ca3af" fontSize={10} />
                <Tooltip
                  contentStyle={{ background: "#1f2937", border: "1px solid rgba(255,255,255,0.1)" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold">User Management</h2>
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4 w-full max-w-md rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder:text-white/40"
          />
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/80">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/80">Name</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-white/80">Coins</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/80">Tier</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/80">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-white/50">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-white/5">
                      <td className="max-w-[180px] truncate px-4 py-3 text-sm">{u.email ?? "—"}</td>
                      <td className="px-4 py-3 text-sm">{u.name ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-medium">{u.coins}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-0.5 text-xs ${u.tier === "BANNED" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                          {u.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={adjusting === u.id}
                            onClick={() => handleAdjustCoins(u.id, 10)}
                            className="rounded bg-violet-600 px-2 py-1 text-xs text-white hover:bg-violet-500 disabled:opacity-50"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            disabled={adjusting === u.id}
                            onClick={() => handleAdjustCoins(u.id, -10)}
                            className="rounded bg-amber-600 px-2 py-1 text-xs text-white hover:bg-amber-500 disabled:opacity-50"
                          >
                            -10
                          </button>
                          <button
                            type="button"
                            disabled={banning === u.id || u.tier === "BANNED"}
                            onClick={() => handleBan(u.id)}
                            className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500 disabled:opacity-50"
                          >
                            Ban
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold">System Health</h2>
          <div className="mb-4 flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${health?.dbConnected ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className="text-sm text-white/80">
              {health?.dbConnected ? "Database connected" : "Database disconnected"}
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-xs">
            {health?.logs?.length === 0 ? (
              <p className="text-white/50">No logs yet</p>
            ) : (
              health?.logs?.map((log) => (
                <div key={log.id} className="border-b border-white/5 py-2 last:border-0">
                  <span className="text-white/50">{log.timestamp}</span> [{log.level}] {log.message}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
