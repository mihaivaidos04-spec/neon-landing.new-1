"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

type BadgeRow = { type: string; createdAt: string; emoji: string; label: string };

type GiftRow = { giftType: string; count: number; emoji: string };

type MePayload = {
  nickname: string | null;
  bio: string;
  avatarUrl: string | null;
  avatarImageFallback: string | null;
  socialInstagram: string | null;
  socialTiktok: string | null;
  socialTwitter: string | null;
  totalMatches: number;
  totalOnlineMinutes: number;
  totalGiftsReceived: number;
  giftsReceivedByType: Record<string, number>;
  dbBadges: BadgeRow[];
  isVip?: boolean;
};

type PublicPayload = {
  userId: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  totalMatches: number;
  totalOnlineMinutes: number;
  giftsTotal: number;
  giftsReceived: GiftRow[];
  badges: BadgeRow[];
  socialInstagram: string | null;
  socialTiktok: string | null;
  socialTwitter: string | null;
  isVip?: boolean;
};

function formatOnlineMinutes(m: number): string {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (r === 0) return `${h}h`;
  return `${h}h ${r}m`;
}

function giftEmoji(type: string): string {
  const map: Record<string, string> = {
    heart: "❤️",
    rose: "🌹",
    coffee: "☕",
    diamond: "💎",
    fire: "🔥",
    rocket: "🚀",
  };
  return map[type] ?? "🎁";
}

const card = "rounded-2xl border border-white/[0.08] bg-[#111118] p-4";

const REPORT_OPTIONS = [
  { value: "inappropriate_behavior", label: "Comportament inadecvat" },
  { value: "spam_ads", label: "Spam / reclame" },
  { value: "offensive_language", label: "Limbaj ofensator" },
  { value: "explicit_content", label: "Conținut explicit" },
  { value: "other", label: "Alt motiv" },
] as const;

type BlockedRow = { userId: string; displayName: string };

type Props = {
  mode: "me" | "public";
  userId: string;
};

export default function NeonProfileView({ mode, userId }: Props) {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [me, setMe] = useState<MePayload | null>(null);
  const [pub, setPub] = useState<PublicPayload | null>(null);

  const [editNick, setEditNick] = useState(false);
  const [editBio, setEditBio] = useState(false);
  const [nickDraft, setNickDraft] = useState("");
  const [bioDraft, setBioDraft] = useState("");
  const [igDraft, setIgDraft] = useState("");
  const [ttDraft, setTtDraft] = useState("");
  const [twDraft, setTwDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>(REPORT_OPTIONS[0].value);
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const [blockedList, setBlockedList] = useState<BlockedRow[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);

  const showReportBlock = mode === "public" && sessionStatus === "authenticated";

  const loadBlocked = useCallback(async () => {
    if (mode !== "me") return;
    setBlockedLoading(true);
    try {
      const res = await fetch("/api/user/blocks", { credentials: "include" });
      const j = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray((j as { blocked?: unknown }).blocked)) {
        setBlockedList((j as { blocked: BlockedRow[] }).blocked);
      } else {
        setBlockedList([]);
      }
    } finally {
      setBlockedLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    void loadBlocked();
  }, [loadBlocked]);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const url = mode === "me" ? "/api/profile/me" : `/api/profile/${userId}`;
      const res = await fetch(url, { credentials: "include" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "Failed to load profile");
        setMe(null);
        setPub(null);
        return;
      }
      if (mode === "me") {
        const d = j as MePayload & { totalGiftsReceived?: number; giftsReceivedByType?: Record<string, number>; dbBadges?: BadgeRow[] };
        setMe({
          nickname: d.nickname ?? null,
          bio: d.bio ?? "",
          avatarUrl: d.avatarUrl ?? null,
          avatarImageFallback: d.avatarImageFallback ?? null,
          socialInstagram: d.socialInstagram ?? null,
          socialTiktok: d.socialTiktok ?? null,
          socialTwitter: d.socialTwitter ?? null,
          totalMatches: d.totalMatches ?? 0,
          totalOnlineMinutes: d.totalOnlineMinutes ?? 0,
          totalGiftsReceived: d.totalGiftsReceived ?? 0,
          giftsReceivedByType: d.giftsReceivedByType ?? {},
          dbBadges: d.dbBadges ?? [],
        });
        setNickDraft(d.nickname ?? "");
        setBioDraft(d.bio ?? "");
        setIgDraft(d.socialInstagram ?? "");
        setTtDraft(d.socialTiktok ?? "");
        setTwDraft(d.socialTwitter ?? "");
        setPub(null);
      } else {
        setPub(j as PublicPayload);
        setMe(null);
      }
    } finally {
      setLoading(false);
    }
  }, [mode, userId, loadBlocked]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (mode !== "me") return;
    const ping = () => {
      void fetch("/api/profile/heartbeat", { method: "POST", credentials: "include" }).catch(() => {});
    };
    ping();
    const id = setInterval(ping, 60_000);
    return () => clearInterval(id);
  }, [mode]);

  const avatarSrc =
    mode === "me"
      ? me?.avatarUrl || me?.avatarImageFallback || null
      : pub?.avatarUrl || null;

  const displayName =
    mode === "me" ? (me?.nickname?.trim() || "Your profile") : pub?.displayName ?? "User";

  const savePatch = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "Save failed");
        return;
      }
      setEditNick(false);
      setEditBio(false);
      await load();
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const onAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || mode !== "me") return;
    setUploading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.set("file", f);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd, credentials: "include" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "Upload failed");
        return;
      }
      await load();
      router.refresh();
    } finally {
      setUploading(false);
    }
  };

  const submitReport = async () => {
    if (!userId) return;
    setReportSubmitting(true);
    try {
      const res = await fetch("/api/user/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reportedUserId: userId,
          reason: reportReason,
          details: reportDetails.trim() || undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((j as { error?: string }).error ?? "Nu am putut trimite raportul");
        return;
      }
      toast.success("Raport trimis");
      setReportOpen(false);
      setReportDetails("");
      setReportReason(REPORT_OPTIONS[0].value);
    } finally {
      setReportSubmitting(false);
    }
  };

  const confirmBlock = async () => {
    if (!userId) return;
    setBlockSubmitting(true);
    try {
      const res = await fetch("/api/user/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ blockedUserId: userId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((j as { error?: string }).error ?? "Blocare eșuată");
        return;
      }
      toast.success("Utilizator blocat");
      setBlockOpen(false);
      router.push("/profile/me");
      router.refresh();
    } finally {
      setBlockSubmitting(false);
    }
  };

  const unblockUser = async (blockedUserId: string) => {
    try {
      const res = await fetch(`/api/user/block/${encodeURIComponent(blockedUserId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((j as { error?: string }).error ?? "Deblocare eșuată");
        return;
      }
      toast.success("Deblocat");
      setBlockedList((prev) => prev.filter((b) => b.userId !== blockedUserId));
    } catch {
      toast.error("Eroare de rețea");
    }
  };

  const statTriple =
    mode === "me" && me
      ? {
          matches: me.totalMatches,
          time: formatOnlineMinutes(me.totalOnlineMinutes),
          gifts: me.totalGiftsReceived,
        }
      : pub
        ? {
            matches: pub.totalMatches,
            time: formatOnlineMinutes(pub.totalOnlineMinutes),
            gifts: pub.giftsTotal,
          }
        : null;

  const badges: BadgeRow[] =
    mode === "me" ? (me?.dbBadges ?? []) : (pub?.badges ?? []);

  const giftsList: { type: string; count: number; emoji: string }[] =
    mode === "me" && me
      ? Object.entries(me.giftsReceivedByType).map(([giftType, count]) => ({
          type: giftType,
          count,
          emoji: giftEmoji(giftType),
        }))
      : (pub?.giftsReceived ?? []).map((g) => ({
          type: g.giftType,
          count: g.count,
          emoji: g.emoji,
        }));

  const social = {
    ig: mode === "me" ? me?.socialInstagram : pub?.socialInstagram,
    tt: mode === "me" ? me?.socialTiktok : pub?.socialTiktok,
    tw: mode === "me" ? me?.socialTwitter : pub?.socialTwitter,
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/60">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-[#a855f7]/30 border-t-[#a855f7]" />
      </div>
    );
  }

  if (err && !me && !pub) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-red-300">{err}</p>
        <Link href="/" className="mt-6 inline-block text-[#a855f7] underline">
          Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-6 pb-24 text-white">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-white/15 bg-[#111118] px-3 py-1.5 text-sm text-white/90 hover:border-[#a855f7]/50"
        >
          ← Back
        </button>
        {mode === "public" && (
          <Link
            href="/profile/me"
            className="ml-auto text-sm font-medium text-[#a855f7] hover:underline"
          >
            My profile
          </Link>
        )}
      </div>

      {err && <p className="mb-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-200">{err}</p>}

      <div className="flex flex-col items-center">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarSrc || "/favicon.ico"}
            alt=""
            width={96}
            height={96}
            className="h-24 w-24 rounded-full border-2 border-[#a855f7]/40 object-cover bg-zinc-800"
          />
          {mode === "me" && (
            <>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onAvatarPick} />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-[#a855f7]/60 bg-[#111118] px-3 py-1 text-[11px] font-semibold text-[#c084fc] hover:bg-[#a855f7]/20 disabled:opacity-50"
              >
                {uploading ? "…" : "Upload"}
              </button>
            </>
          )}
        </div>

        <div className="mt-6 flex w-full flex-col items-center gap-2">
          {mode === "me" && editNick ? (
            <div className="flex w-full max-w-sm flex-col gap-2">
              <input
                value={nickDraft}
                onChange={(e) => setNickDraft(e.target.value)}
                className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-center text-lg font-semibold outline-none focus:border-[#a855f7]"
                maxLength={20}
              />
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void savePatch({ nickname: nickDraft })}
                  className="rounded-full bg-[#a855f7] px-4 py-1.5 text-sm font-bold text-white"
                >
                  Save
                </button>
                <button type="button" onClick={() => setEditNick(false)} className="text-sm text-white/60">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <h1 className="text-xl font-bold">{displayName}</h1>
              {((mode === "public" && pub?.isVip) || (mode === "me" && me?.isVip)) && (
                <span className="rounded-full border border-emerald-500/45 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-200/95">
                  🌍 AI Translator Active
                </span>
              )}
              {mode === "me" && (
                <button type="button" onClick={() => setEditNick(true)} className="text-xs font-semibold text-[#a855f7]">
                  Edit
                </button>
              )}
            </div>
          )}

          {mode === "me" && editBio ? (
            <div className="mt-2 w-full max-w-sm">
              <textarea
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                rows={4}
                maxLength={150}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#a855f7]"
              />
              <div className="mt-2 flex justify-center gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void savePatch({ bio: bioDraft })}
                  className="rounded-full bg-[#a855f7] px-4 py-1.5 text-sm font-bold text-white"
                >
                  Save bio
                </button>
                <button type="button" onClick={() => setEditBio(false)} className="text-sm text-white/60">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex max-w-sm flex-col items-center gap-1">
              <p className="text-center text-sm text-white/70">{mode === "me" ? me?.bio || "No bio yet." : pub?.bio || ""}</p>
              {mode === "me" && (
                <button type="button" onClick={() => setEditBio(true)} className="text-xs font-semibold text-[#a855f7]">
                  Edit
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {statTriple && (
        <div className="mt-8 grid grid-cols-3 gap-2">
          {[
            { label: "Match", value: String(statTriple.matches) },
            { label: "Time", value: statTriple.time },
            { label: "Cadouri", value: String(statTriple.gifts) },
          ].map((s) => (
            <div key={s.label} className={`${card} flex flex-col items-center py-3`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">{s.label}</span>
              <span className="mt-1 text-lg font-bold tabular-nums text-[#e9d5ff]">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#a855f7]/90">Badges</h2>
        <div className={`${card} flex flex-wrap gap-3`}>
          {badges.length === 0 ? (
            <span className="text-sm text-white/40">No badges yet.</span>
          ) : (
            badges.map((b) => (
              <span key={b.type} title={b.label} className="text-2xl leading-none" role="img" aria-label={b.label}>
                {b.emoji}
              </span>
            ))
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#a855f7]/90">Social</h2>
        {mode === "me" ? (
          <div className={`${card} flex flex-col gap-3`}>
            <label className="text-[10px] font-semibold uppercase text-white/40">Instagram URL</label>
            <input
              value={igDraft}
              onChange={(e) => setIgDraft(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#a855f7]/50"
              placeholder="https://instagram.com/…"
            />
            <label className="text-[10px] font-semibold uppercase text-white/40">TikTok URL</label>
            <input
              value={ttDraft}
              onChange={(e) => setTtDraft(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#a855f7]/50"
              placeholder="https://tiktok.com/@…"
            />
            <label className="text-[10px] font-semibold uppercase text-white/40">X (Twitter) URL</label>
            <input
              value={twDraft}
              onChange={(e) => setTwDraft(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#a855f7]/50"
              placeholder="https://x.com/…"
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => void savePatch({ socialInstagram: igDraft, socialTiktok: ttDraft, socialTwitter: twDraft })}
              className="mt-2 rounded-full bg-[#a855f7] py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              Save social links
            </button>
          </div>
        ) : (
          <div className={`${card} flex flex-wrap gap-2`}>
            <SocialButton kind="instagram" href={social.ig} />
            <SocialButton kind="tiktok" href={social.tt} />
            <SocialButton kind="x" href={social.tw} />
            {!social.ig && !social.tt && !social.tw && (
              <span className="text-sm text-white/40">No links shared.</span>
            )}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#a855f7]/90">Cadouri primite</h2>
        <div className={`${card} flex flex-wrap gap-3`}>
          {giftsList.length === 0 ? (
            <span className="text-sm text-white/40">No gifts yet.</span>
          ) : (
            giftsList.map((g) => (
              <span key={g.type} className="text-lg font-semibold tabular-nums text-white/90">
                {g.emoji} ×{g.count}
              </span>
            ))
          )}
        </div>
      </section>

      {showReportBlock && (
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-8">
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="w-full rounded-2xl border border-red-500/35 bg-transparent py-3.5 text-center text-sm font-bold text-red-400/95 transition hover:border-red-500/55 hover:bg-red-500/10"
          >
            RAPORTEAZĂ
          </button>
          <button
            type="button"
            onClick={() => setBlockOpen(true)}
            className="w-full rounded-2xl border border-white/20 bg-transparent py-3.5 text-center text-sm font-bold text-white/50 transition hover:border-white/30 hover:bg-white/[0.04] hover:text-white/65"
          >
            BLOCHEAZĂ
          </button>
        </div>
      )}

      {mode === "me" && (
        <section className="mt-10 border-t border-white/10 pt-8">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#a855f7]/90">
            Utilizatori blocați
          </h2>
          <div className={`${card} space-y-2`}>
            {blockedLoading ? (
              <p className="text-sm text-white/40">Se încarcă…</p>
            ) : blockedList.length === 0 ? (
              <p className="text-sm text-white/45">Nu ai blocat niciun utilizator</p>
            ) : (
              blockedList.map((b) => (
                <div
                  key={b.userId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/25 px-3 py-2.5"
                >
                  <span className="min-w-0 truncate text-sm text-white/90">
                    <span aria-hidden>👤 </span>
                    {b.displayName}
                  </span>
                  <button
                    type="button"
                    onClick={() => void unblockUser(b.userId)}
                    className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70 hover:border-[#a855f7]/40 hover:text-[#e9d5ff]"
                  >
                    Deblochează
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {mode === "me" && (
        <p className="mt-8 text-center text-[10px] text-white/35">
          Public URL:{" "}
          <Link href={`/profile/${userId}`} className="text-[#a855f7] hover:underline">
            /profile/{userId.slice(0, 8)}…
          </Link>
        </p>
      )}

      {reportOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm sm:items-center"
          role="presentation"
          onClick={() => setReportOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111118] p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="report-modal-title" className="text-lg font-bold text-white">
              Raportează utilizatorul
            </h2>
            <div className="mt-4 space-y-2">
              {REPORT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 has-[:checked]:border-[#a855f7]/50"
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={opt.value}
                    checked={reportReason === opt.value}
                    onChange={() => setReportReason(opt.value)}
                    className="accent-[#a855f7]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <label className="mt-4 block text-xs font-medium text-white/50">
              Detalii suplimentare (opțional)
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
                maxLength={2000}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#a855f7]/50"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/10"
              >
                Anulează
              </button>
              <button
                type="button"
                disabled={reportSubmitting}
                onClick={() => void submitReport()}
                className="rounded-full bg-[#a855f7] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {reportSubmitting ? "Se trimite…" : "Trimite raport"}
              </button>
            </div>
          </div>
        </div>
      )}

      {blockOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm sm:items-center"
          role="presentation"
          onClick={() => setBlockOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111118] p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="block-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="block-modal-title" className="text-lg font-bold text-white">
              Blochează utilizatorul?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Nu vei mai fi conectat cu acest utilizator în viitor.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBlockOpen(false)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/10"
              >
                Anulează
              </button>
              <button
                type="button"
                disabled={blockSubmitting}
                onClick={() => void confirmBlock()}
                className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-50"
              >
                {blockSubmitting ? "…" : "Blochează"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SocialButton({ kind, href }: { kind: "instagram" | "tiktok" | "x"; href: string | null | undefined }) {
  if (!href?.trim()) return null;
  const url = href.startsWith("http") ? href : `https://${href}`;
  const labels = { instagram: "Instagram", tiktok: "TikTok", x: "X" };
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-black/35 px-4 py-2.5 text-sm font-bold text-white transition hover:border-[#a855f7]/45"
    >
      {kind === "instagram" && <InstagramIcon />}
      {kind === "tiktok" && <TikTokIcon />}
      {kind === "x" && <XIcon />}
      {labels[kind]}
    </a>
  );
}

function InstagramIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
