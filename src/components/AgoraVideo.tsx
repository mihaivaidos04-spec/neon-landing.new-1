"use client";

import { useEffect, useRef, useState } from "react";
import AgoraRTC, { type IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";

type Props = {
  channelName: string;
  onError?: (err: Error) => void;
};

export default function AgoraVideo({ channelName, onError }: Props) {
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<ReturnType<typeof AgoraRTC.createClient> | null>(null);
  const tracksRef = useRef<{ audio: any; video: any } | null>(null);

  useEffect(() => {
    if (!channelName) return;

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    if (!appId) {
      setError("Agora not configured. Set NEXT_PUBLIC_AGORA_APP_ID.");
      return;
    }

    let client: ReturnType<typeof AgoraRTC.createClient> | null = null;
    let audioTrack: any = null;
    let videoTrack: any = null;

    const init = async () => {
      try {
        const res = await fetch(`/api/agora/token?channel=${encodeURIComponent(channelName)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to get token");
        }
        const { token, uid } = data;

        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (user, mediaType) => {
          await client!.subscribe(user, mediaType);
          setRemoteUsers((prev) => {
            if (prev.some((u) => u.uid === user.uid)) return prev;
            return [...prev, user];
          });
        });

        client.on("user-unpublished", (user) => {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        });

        [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        tracksRef.current = { audio: audioTrack, video: videoTrack };

        await client.join(appId, channelName, token, uid);
        await client.publish([audioTrack, videoTrack]);

        if (localVideoRef.current && videoTrack) {
          videoTrack.play(localVideoRef.current);
        }

        setJoined(true);
        setError(null);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e.message);
        onError?.(e);
      }
    };

    init();

    return () => {
      clientRef.current = null;
      if (client) {
        client.leave();
      }
      if (audioTrack) audioTrack.close();
      if (videoTrack) videoTrack.close();
      tracksRef.current = null;
      setRemoteUsers([]);
      setJoined(false);
    };
  }, [channelName, onError]);

  useEffect(() => {
    if (!remoteVideoRef.current || remoteUsers.length === 0) return;
    const user = remoteUsers[0];
    if (user.videoTrack) {
      user.videoTrack.play(remoteVideoRef.current);
    }
  }, [remoteUsers]);

  if (error) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-zinc-900 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      {/* Remote video (main) */}
      <div
        ref={remoteVideoRef}
        className="absolute inset-0 h-full w-full bg-zinc-900"
      >
        {!joined && (
          <div className="flex h-full items-center justify-center text-white/50">
            Connecting...
          </div>
        )}
        {joined && remoteUsers.length === 0 && (
          <div className="flex h-full items-center justify-center text-white/50">
            Waiting for partner...
          </div>
        )}
      </div>
      {/* Local video (corner) */}
      <div
        ref={localVideoRef}
        className="absolute bottom-3 right-3 h-24 w-32 overflow-hidden rounded-lg border-2 border-[#8b5cf6]/60 bg-black sm:h-28 sm:w-36"
      />
    </div>
  );
}
