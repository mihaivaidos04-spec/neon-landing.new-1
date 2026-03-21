"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import ProfilePresenceBadge from "./ProfilePresenceBadge";

type FriendUser = {
  id: string;
  name: string | null;
  image: string | null;
  lastSeenAt: string;
};

type PendingRow = { id: string; user: FriendUser };

type Props = {
  t: (key: string) => string;
};

export default function ProfileFriendsTab({ t }: Props) {
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incoming, setIncoming] = useState<PendingRow[]>([]);
  const [outgoing, setOutgoing] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendIdInput, setFriendIdInput] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/friends");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "load");
      setFriends(data.friends ?? []);
      setIncoming(data.incoming ?? []);
      setOutgoing(data.outgoing ?? []);
    } catch {
      toast.error("Could not load friends");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const postAction = async (body: Record<string, string>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Failed");
        return;
      }
      toast.success("OK");
      await load();
      setFriendIdInput("");
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-violet-300">
          {t("profile.addFriend")}
        </h2>
        <p className="mb-3 text-xs text-white/50">{t("profile.friendIdHelp")}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={friendIdInput}
            onChange={(e) => setFriendIdInput(e.target.value.trim())}
            placeholder={t("profile.friendIdPlaceholder")}
            className="min-h-11 flex-1 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/35"
          />
          <button
            type="button"
            disabled={busy || !friendIdInput}
            onClick={() => void postAction({ action: "request", targetUserId: friendIdInput })}
            className="min-h-11 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {t("profile.friendSendRequest")}
          </button>
        </div>
      </section>

      {incoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-300/90">
            {t("profile.friendRequests")}
          </h2>
          <ul className="space-y-3">
            {incoming.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-950/20 p-3"
              >
                <FriendRowMini user={row.user} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void postAction({ action: "accept", requesterId: row.user.id })}
                    className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-200"
                  >
                    {t("profile.acceptFriend")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void postAction({ action: "decline", requesterId: row.user.id })}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70"
                  >
                    {t("profile.declineFriend")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
            {t("profile.outgoingRequests")}
          </h2>
          <ul className="space-y-2">
            {outgoing.map((row) => (
              <li key={row.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                <FriendRowMini user={row.user} />
                <span className="text-[10px] uppercase text-white/40">{t("profile.pending")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-violet-200">{t("profile.friendsTitle")}</h2>
        {loading ? (
          <p className="text-sm text-white/50">{t("common.loading")}</p>
        ) : friends.length === 0 ? (
          <p className="text-sm text-white/50">{t("profile.noFriendsYet")}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {friends.map((f) => (
              <li
                key={f.id}
                className="flex items-start gap-3 rounded-xl border border-fuchsia-500/20 bg-black/35 p-4 shadow-[0_0_20px_rgba(236,72,153,0.06)]"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-violet-500/30 bg-violet-950">
                  {f.image ? (
                    <Image src={f.image} alt="" fill className="object-cover" sizes="48px" unoptimized />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-lg text-violet-400">?</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{f.name ?? f.id.slice(0, 8)}</p>
                  <ProfilePresenceBadge userId={f.id} lastSeenAtIso={f.lastSeenAt} isSelf={false} className="mt-1" />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void postAction({ action: "remove", targetUserId: f.id })}
                    className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-red-300/80 hover:text-red-200"
                  >
                    {t("profile.removeFriend")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FriendRowMini({ user }: { user: FriendUser }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/15 bg-black">
        {user.image ? (
          <Image src={user.image} alt="" fill className="object-cover" sizes="36px" unoptimized />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs text-white/50">?</span>
        )}
      </div>
      <span className="text-sm font-medium text-white">{user.name ?? user.id.slice(0, 8)}</span>
    </div>
  );
}
