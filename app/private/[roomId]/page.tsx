"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getContentT } from "@/src/lib/content-i18n";
import { getBrowserLocale } from "@/src/lib/content-i18n";
import { useSocketContext } from "@/src/contexts/SocketContext";
import PrivateRoomVideoWebRTC from "@/src/components/PrivateRoomVideoWebRTC";

export default function PrivateRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const roomId = params.roomId as string;
  const [room, setRoom] = useState<{
    id: string;
    host_user_id: string;
    guest_user_id: string;
    status: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [closed, setClosed] = useState(false);
  const { socket, connected } = useSocketContext();
  const locale = getBrowserLocale();
  const t = getContentT(locale);

  useEffect(() => {
    if (!roomId) return;

    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/private/room?roomId=${roomId}`);
        const data = await res.json();
        if (data.room) {
          setRoom(data.room);
          if (data.room.status === "closed") setClosed(true);
        } else {
          setRoom(null);
        }
      } catch {
        setRoom(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit("join_room", roomId);

    const onClosed = (data: { roomId: string }) => {
      if (data.roomId === roomId) setClosed(true);
    };

    socket.on("private_room_closed", onClosed);
    return () => {
      socket.off("private_room_closed", onClosed);
    };
  }, [socket, roomId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/70">{t.searching}</p>
      </div>
    );
  }

  if (!room || closed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-center text-white/80">{t.privateRoomClosed}</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-full bg-[#8b5cf6] px-6 py-3 font-semibold text-white"
        >
          Înapoi
        </button>
      </div>
    );
  }

  const userId = (session as { userId?: string })?.userId ?? session?.user?.id;
  const isHost = room.host_user_id === userId;
  const peerUserId =
    userId === room.host_user_id ? room.guest_user_id : room.host_user_id;

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-xl font-semibold text-white">
          {t.privateRoomTitle} • {roomId.slice(0, 8)}...
        </h1>
        <p className="text-sm text-white/60">
          {isHost
            ? "Tu ești hostul. Camera costă 5 bănuți/minut."
            : "Ești invitat în această cameră privată."}
        </p>
        <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl">
          {userId && peerUserId ? (
            <PrivateRoomVideoWebRTC
              roomId={roomId}
              myUserId={userId}
              peerUserId={peerUserId}
              socket={socket}
              socketConnected={connected}
              onLeave={() => router.push("/")}
            />
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center bg-zinc-900 text-white/60">
              {t.searching}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-4 rounded-full border border-fuchsia-500/30 px-6 py-2 text-fuchsia-100/90 hover:bg-fuchsia-950/30"
        >
          Părăsește camera
        </button>
      </div>
    </div>
  );
}
