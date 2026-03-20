"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Report = {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  reporter: { id: string; name: string | null; email: string | null };
  reported: { id: string; name: string | null; email: string | null; isShadowBanned: boolean };
};

export default function AdminReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/admin/reports")
      .then((r) => r.json())
      .then((d) => setReports(d.reports ?? []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [status, router]);

  const handleAction = async (
    reportId: string,
    action: "dismissed" | "reviewed" | "action_taken",
    shadowBan?: boolean
  ) => {
    setUpdating(reportId);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          status: action,
          shadowBanUser: shadowBan ?? false,
        }),
      });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId ? { ...r, status: action } : r
          )
        );
      }
    } finally {
      setUpdating(null);
    }
  };

  if (status !== "authenticated") return null;

  return (
    <div className="min-h-screen bg-[#050508] p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Reports</h1>
          <Link
            href="/admin"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/5"
          >
            ← Admin
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
          </div>
        ) : reports.length === 0 ? (
          <p className="text-white/60">No reports</p>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-white/60">
                      {r.reporter.email ?? r.reporter.name ?? r.reporterId} reported{" "}
                      {r.reported.email ?? r.reported.name ?? r.reportedUserId}
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      Reason: {r.reason ?? "—"} · {new Date(r.createdAt).toLocaleString()}
                    </p>
                    {r.reported.isShadowBanned && (
                      <span className="mt-2 inline-block rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                        Shadow-banned
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAction(r.id, "dismissed")}
                      disabled={updating === r.id}
                      className="rounded bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20 disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(r.id, "action_taken", true)}
                      disabled={updating === r.id}
                      className="rounded bg-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                    >
                      Shadow ban
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
