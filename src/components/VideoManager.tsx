"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import AgoraRTC, { type IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";

export type VideoManagerHandle = {
  joinChannel: (channelName: string) => Promise<void>;
};

type Props = {
  onNext?: () => void;
  onError?: (err: Error) => void;
};

const VideoManager = forwardRef<VideoManagerHandle, Props>(
  function VideoManager({ onNext, onError }, ref) {
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string>("");
  const clientRef = useRef<ReturnType<typeof AgoraRTC.createClient> | null>(null);
  const tracksRef = useRef<{ audio: any; video: any } | null>(null);

  const leaveChannel = useCallback(async () => {
    const client = clientRef.current;
    const tracks = tracksRef.current;
    if (client) {
      await client.leave();
      clientRef.current = null;
    }
    if (tracks) {
      tracks.audio?.close();
      tracks.video?.close();
      tracksRef.current = null;
    }
    setRemoteUsers([]);
    setJoined(false);
  }, []);

  const joinChannel = useCallback(
    async (name: string) => {
      if (!name?.trim()) return;
      await leaveChannel();
      setChannelName(name.trim());
      setError(null);

      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
      if (!appId) {
        setError("Set NEXT_PUBLIC_AGORA_APP_ID în .env.local");
        return;
      }

      try {
        const res = await fetch(
          `/api/agora/token?channel=${encodeURIComponent(name.trim())}`
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Eroare la obținerea token-ului");
        }
        const { token, uid } = data;

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          setRemoteUsers((prev) => {
            if (prev.some((u) => u.uid === user.uid)) return prev;
            return [...prev, user];
          });
        });

        client.on("user-unpublished", (user) => {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        });

        const [audioTrack, videoTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();
        tracksRef.current = { audio: audioTrack, video: videoTrack };

        await client.join(appId, name.trim(), token || null, uid);
        await client.publish([audioTrack, videoTrack]);

        if (localVideoRef.current && videoTrack) {
          videoTrack.play(localVideoRef.current);
        }

        setJoined(true);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e.message);
        onError?.(e);
      }
    },
    [leaveChannel, onError]
  );

  const toggleMute = useCallback(() => {
    const tracks = tracksRef.current;
    if (tracks?.audio) {
      tracks.audio.setEnabled(muted);
      setMuted((m) => !m);
    }
  }, [muted]);

  const toggleCamera = useCallback(() => {
    const tracks = tracksRef.current;
    if (tracks?.video) {
      tracks.video.setEnabled(cameraOff);
      setCameraOff((c) => !c);
    }
  }, [cameraOff]);

  const handleNext = useCallback(async () => {
    await leaveChannel();
    setChannelName("");
    onNext?.();
  }, [leaveChannel, onNext]);

  useImperativeHandle(ref, () => ({
    joinChannel,
  }), [joinChannel]);

  useEffect(() => {
    return () => {
      leaveChannel();
    };
  }, [leaveChannel]);

  useEffect(() => {
    if (!remoteVideoRef.current || remoteUsers.length === 0) return;
    const user = remoteUsers[0];
    if (user.videoTrack) {
      user.videoTrack.play(remoteVideoRef.current);
    }
  }, [remoteUsers]);

  if (error) {
    return (
      <div className="flex min-h-[50vh] w-full flex-col items-center justify-center rounded-xl bg-zinc-900 p-4 text-red-400">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => setError(null)}
          className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-sm text-white"
        >
          Închide
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full min-h-[200px]">
      {/* Remote video – full screen, object-cover for mobile */}
      <div
        ref={remoteVideoRef}
        className="theater-agora-remote absolute inset-0 h-full w-full min-h-0 overflow-hidden bg-black"
      >
        {!joined && (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-white/50">
            Apasă &quot;Join&quot; sau așteaptă conexiunea...
          </div>
        )}
        {joined && remoteUsers.length === 0 && (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-white/50">
            Așteptăm partenerul...
          </div>
        )}
      </div>

      {/* Local video – small corner, object-cover for mobile */}
      <div
        ref={localVideoRef}
        className="theater-agora-local absolute bottom-20 right-3 h-24 w-32 overflow-hidden rounded-lg border-2 border-[#8b5cf6]/60 bg-black sm:bottom-24 sm:h-28 sm:w-36"
      />

      {/* Controls */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        <button
          type="button"
          onClick={toggleMute}
          disabled={!joined}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
            muted
              ? "bg-red-500/80 text-white"
              : "bg-white/20 text-white hover:bg-white/30"
          } ${!joined ? "cursor-not-allowed opacity-50" : ""}`}
          title={muted ? "Dezmutează" : "Mute"}
        >
          {muted ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.35s5.42-2.35 5.91-5.35c.1-.6-.39-1.14-1-1.14z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={toggleCamera}
          disabled={!joined}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
            cameraOff
              ? "bg-red-500/80 text-white"
              : "bg-white/20 text-white hover:bg-white/30"
          } ${!joined ? "cursor-not-allowed opacity-50" : ""}`}
          title={cameraOff ? "Pornește camera" : "Oprește camera"}
        >
          {cameraOff ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 10.48V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4.48l4 3.98v-11l-4 3.98zm-2-.79V18H4V6h12v3.69z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex h-12 items-center justify-center rounded-full bg-[#8b5cf6] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#7c3aed]"
        >
          Next
        </button>
      </div>
    </div>
  );
});

export default VideoManager;
