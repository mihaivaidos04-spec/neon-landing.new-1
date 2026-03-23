"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type LogRow = {
  id: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  content: string;
  reason: string;
  severity: string;
  action: string;
  createdAt: string;
};

type Stats = {
  blockedToday: number;
  warnedToday: number;
  bannedToday: number;
  activeTimedBans: number;
  permanentBannedUsers: number;
};

export default function AdminAiModerationPage() {
  const { status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [lifting, setLifting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sp = new URLSearchParams();
    if (severity) sp.set("severity", severity);
    if (action) sp.set("action", action);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    sp.set("limit", "200");
    const [lRes, sRes] = await Promise.all([
      fetch(`/api/admin/moderation/logs?${sp.toString()}`),
      fetch("/api/admin/moderation/stats"),
    ]);
    if (lRes.ok) {
      const j = await lRes.json();
      setLogs(j.logs ?? []);
    } else {
      setLogs([]);
    }
    if (sRes.ok) {
      setStats(await sRes.json());
    }
  }, [severity, action, from, to]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, router, load]);

  const applyFilters = () => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  };

  const liftBan = async (userId: string) => {
    if (!confirm("Lift timed ban for this user? (Clears bannedUntil; tier BANNED unchanged.)")) return;
    setLifting(userId);
    try {
      const res = await fetch("/api/admin/moderation/lift-ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        await load();
        const sRes = await fetch("/api/admin/moderation/stats");
        if (sRes.ok) setStats(await sRes.json());
      } else {
        alert("Failed");
      }
    } finally {
      setLifting(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <span className="animate-pulse">Loading…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">AI Moderation</h1>
            <p className="mt-1 text-sm text-white/55">Anthropic-powered logs, filters, and ban overrides.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/admin" className="text-violet-400 hover:underline">
              Dashboard
            </Link>
            <Link href="/admin/reports" className="text-violet-400 hover:underline">
              Reports
            </Link>
            <Link href="/" className="text-white/50 hover:text-white">
              ← App
            </Link>
          </div>
        </div>

        {stats && (
          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/50">Messages blocked (today UTC)</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.blockedToday}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/50">Warnings (today UTC)</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.warnedToday}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/50">Auto-bans logged (today UTC)</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.bannedToday}</p>
            </div>
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
              <p className="text-xs text-amber-200/70">Active timed bans</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-100">{stats.activeTimedBans}</p>
            </div>
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4">
              <p className="text-xs text-red-200/70">Permanent (tier BANNED)</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-red-100">{stats.permanentBannedUsers}</p>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <label className="flex flex-col gap-1 text-xs text-white/50">
            Severity
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white"
            >
              <option value="">Any</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-white/50">
            Action
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white"
            >
              <option value="">Any</option>
              <option value="blocked">blocked</option>
              <option value="warned">warned</option>
              <option value="banned">banned</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-white/50">
            From (ISO date)
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-white/50">
            To (ISO date)
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white"
            />
          </label>
          <button
            type="button"
            onClick={() => applyFilters()}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-500"
          >
            Apply filters
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-white/70">
                <th className="px-3 py-3">When</th>
                <th className="px-3 py-3">User</th>
                <th className="px-3 py-3">Severity</th>
                <th className="px-3 py-3">Action</th>
                <th className="px-3 py-3">Reason</th>
                <th className="px-3 py-3">Content</th>
                <th className="px-3 py-3">Override</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-white/45">
                    No moderation logs match.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="border-b border-white/5 align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-white/50">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="max-w-[140px] truncate px-3 py-2 text-xs" title={l.userId}>
                      {l.userName || l.userEmail || l.userId.slice(0, 8)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-white/10 px-2 py-0.5 text-xs">{l.severity}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          l.action === "banned"
                            ? "bg-red-500/20 text-red-300"
                            : l.action === "warned"
                              ? "bg-amber-500/20 text-amber-200"
                              : "bg-zinc-500/20 text-zinc-200"
                        }`}
                      >
                        {l.action}
                      </span>
                    </td>
                    <td className="max-w-[200px] px-3 py-2 text-xs text-white/75">{l.reason}</td>
                    <td className="max-w-[280px] px-3 py-2 text-xs text-white/55">
                      <span className="line-clamp-3">{l.content}</span>
                    </td>
                    <td className="px-3 py-2">
                      {l.action === "banned" ? (
                        <button
                          type="button"
                          disabled={lifting === l.userId}
                          onClick={() => liftBan(l.userId)}
                          className="whitespace-nowrap rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"
                        >
                          {lifting === l.userId ? "…" : "Review & lift ban"}
                        </button>
                      ) : (
                        <span className="text-white/25">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
