"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { buildInviteShareText, buildInviteShareUrl, openWhatsAppInvite } from "@/src/lib/invite-share";

type MeResponse = {
  referralCode: string;
  referralLink: string;
  referralCount: number;
  referralCoins: number;
};

type LeaderRow = {
  rank: number;
  displayName: string;
  invites: number;
  userId: string;
};

export default function ReferralPage() {
  const { status } = useSession();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [monthLabel, setMonthLabel] = useState("");

  const load = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const [m, lb] = await Promise.all([
        fetch("/api/referral/me", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/referral/leaderboard", { credentials: "include" }).then((r) => r.json()),
      ]);
      if (m.referralCode) {
        setMe({
          referralCode: m.referralCode,
          referralLink: m.referralLink,
          referralCount: m.referralCount ?? 0,
          referralCoins: m.referralCoins ?? 0,
        });
      }
      if (lb.leaderboard) {
        setLeaderboard(lb.leaderboard);
        const d = new Date(Date.UTC(lb.year, lb.month - 1, 1));
        setMonthLabel(
          d.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
        );
      }
    } catch {
      toast.error("Could not load referral data");
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const copyLink = () => {
    const link = me?.referralLink ?? "";
    if (!link) return;
    void navigator.clipboard.writeText(link).then(
      () => toast.success("Link copied"),
      () => toast.error("Copy failed")
    );
  };

  const shareWhatsApp = () => {
    if (!me?.referralCode) return;
    openWhatsAppInvite(buildInviteShareText(me.referralCode));
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030306] text-white/60">
        Loading…
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#030306] px-4 py-16 text-center text-white">
        <p className="text-lg">Sign in to see your referral link.</p>
        <Link href="/" className="mt-6 inline-block text-violet-400 underline">
          Back to NeonLive
        </Link>
      </div>
    );
  }

  const clientPreviewUrl = me?.referralCode ? buildInviteShareUrl(me.referralCode) : "";

  return (
    <div className="min-h-screen max-w-[100vw] overflow-x-hidden bg-[#030306] text-white antialiased">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% -20%, rgba(139, 92, 246, 0.15), transparent 55%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(57, 255, 20, 0.06), transparent 45%)",
        }}
      />
      <main className="relative z-10 mx-auto max-w-lg px-4 py-10 sm:py-14">
        <Link href="/" className="text-sm text-white/45 underline hover:text-white/80">
          ← Home
        </Link>
        <h1 className="mt-4 font-serif text-2xl font-light tracking-tight sm:text-3xl">Invite friends</h1>
        <p className="mt-2 text-sm text-white/55">
          Share your link. Friends get <strong className="text-fuchsia-300">25 bonus coins</strong> when they
          join; you earn <strong className="text-fuchsia-300">50 coins</strong> per signup and{" "}
          <strong className="text-fuchsia-300">100 coins</strong> when they buy a coin pack.
        </p>

        {me && (
          <>
            <div className="mt-8 rounded-2xl border border-violet-500/35 bg-black/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-300/90">Your link</p>
              <p className="mt-2 break-all text-sm text-white/85">{me.referralLink || clientPreviewUrl}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={copyLink}
                  className="min-h-11 flex-1 rounded-xl border border-fuchsia-500/40 bg-violet-950/50 py-2.5 text-sm font-semibold text-white transition hover:border-fuchsia-400/60"
                >
                  Copy link
                </button>
                <button
                  type="button"
                  onClick={shareWhatsApp}
                  className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(34,197,94,0.25)] transition hover:brightness-110"
                  style={{ background: "#25D366" }}
                  aria-label="Share on WhatsApp"
                >
                  <WhatsAppGlyph className="h-5 w-5 shrink-0 text-white" />
                  WhatsApp
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-white/70">
              You invited <span className="font-bold text-fuchsia-200 tabular-nums">{me.referralCount}</span>{" "}
              friends and earned{" "}
              <span className="font-bold text-amber-200 tabular-nums">{me.referralCoins}</span> coins from
              referrals.
            </p>
          </>
        )}

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-white">Top referrers</h2>
          <p className="text-xs text-white/45">{monthLabel || "This month (UTC)"}</p>
          <ul className="mt-4 space-y-2">
            {leaderboard.length === 0 && (
              <li className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-center text-sm text-white/50">
                No invites yet this month — be the first!
              </li>
            )}
            {leaderboard.map((row) => (
              <li
                key={row.userId}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/35 px-3 py-2.5"
              >
                <span className="flex items-center gap-2 text-sm">
                  <span className="w-6 font-mono text-violet-300 tabular-nums">#{row.rank}</span>
                  <span className="truncate text-white/90">{row.displayName}</span>
                </span>
                <span className="shrink-0 text-xs text-white/50 tabular-nums">{row.invites} invites</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
