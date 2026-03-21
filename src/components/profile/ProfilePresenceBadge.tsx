"use client";

import { useEffect, useState } from "react";
import { useSocketContext } from "@/src/contexts/SocketContext";

type Props = {
  userId: string;
  lastSeenAtIso: string;
  isSelf: boolean;
  className?: string;
};

function formatLastSeenShort(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "● Offline";
  const diffMin = Math.floor((Date.now() - t) / 60_000);
  if (diffMin < 1) return "● Last seen just now";
  if (diffMin < 60) return `● Last seen ${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 48) return `● Last seen ${diffH}h ago`;
  return `● Last seen ${Math.floor(diffH / 24)}d ago`;
}

/**
 * Green dot + “Active now” when Socket.io shows user online; else gray + last seen.
 */
export default function ProfilePresenceBadge({
  userId,
  lastSeenAtIso,
  isSelf,
  className = "",
}: Props) {
  const { socket, connected } = useSocketContext();
  const [peerOnline, setPeerOnline] = useState(false);
  const [peerLastSeen, setPeerLastSeen] = useState(lastSeenAtIso);

  useEffect(() => {
    setPeerLastSeen(lastSeenAtIso);
  }, [lastSeenAtIso]);

  const selfOnline = isSelf && connected;

  useEffect(() => {
    if (isSelf) return;
    if (!socket || !userId) return;

    const run = () => socket.emit("presence_query", { userIds: [userId] });
    const onResult = (payload: unknown) => {
      const map = (payload as { map?: Record<string, { online?: boolean; lastSeenAt?: string | null }> })?.map;
      const row = map?.[userId];
      if (row) {
        setPeerOnline(Boolean(row.online));
        if (row.lastSeenAt) setPeerLastSeen(row.lastSeenAt);
      }
    };
    socket.on("presence_result", onResult);
    run();
    const id = setInterval(run, 25_000);
    return () => {
      clearInterval(id);
      socket.off("presence_result", onResult);
    };
  }, [socket, userId, isSelf]);

  const showActive = selfOnline || (!isSelf && peerOnline);

  if (showActive) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300/95 ${className}`}
      >
        <span
          className="relative flex h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.95),0_0_20px_rgba(16,185,129,0.5)]"
          aria-hidden
        />
        <span>● Active now</span>
      </span>
    );
  }

  const label = isSelf ? formatLastSeenShort(lastSeenAtIso) : formatLastSeenShort(peerLastSeen);

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-white/45 ${className}`}>
      <span className="h-2 w-2 shrink-0 rounded-full bg-white/35" aria-hidden />
      <span>{label}</span>
    </span>
  );
}
