"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AgoraRTC, { type IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";

export type AgoraTheaterState = {
  joined: boolean;
  joining: boolean;
  error: string | null;
  muted: boolean;
  cameraOff: boolean;
  hasRemoteVideo: boolean;
  toggleMute: () => void;
  toggleCamera: () => void;
};

function stableUidFromUserId(userIdKey: string): number | undefined {
  if (!userIdKey) return undefined;
  let h = 0;
  for (let i = 0; i < userIdKey.length; i++) {
    h = (Math.imul(31, h) + userIdKey.charCodeAt(i)) | 0;
  }
  const n = Math.abs(h) % 2147483640;
  return n + 1;
}

type UseAgoraTheaterOptions = {
  channelName: string | null;
  enabled: boolean;
  userIdKey: string;
  localContainerRef: React.RefObject<HTMLDivElement | null>;
  remoteContainerRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * Agora RTC for main theater: join, publish mic+camera, subscribe to remote.
 * Token from /api/agora/token; null token when AGORA_APP_CERTIFICATE is unset (testing).
 */
export function useAgoraTheater({
  channelName,
  enabled,
  userIdKey,
  localContainerRef,
  remoteContainerRef,
}: UseAgoraTheaterOptions): AgoraTheaterState {
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  const clientRef = useRef<ReturnType<typeof AgoraRTC.createClient> | null>(null);
  const tracksRef = useRef<{
    audio: import("agora-rtc-sdk-ng").IMicrophoneAudioTrack;
    video: import("agora-rtc-sdk-ng").ICameraVideoTrack;
  } | null>(null);

  /** Alone: local camera fills the large (remote) stage. With a peer: remote in large, local in PiP. */
  function syncVideoLayout() {
    const client = clientRef.current;
    const tracks = tracksRef.current;
    const remEl = remoteContainerRef.current;
    const locEl = localContainerRef.current;
    if (!client || !tracks?.video || !remEl) return;

    const peer = client.remoteUsers.find((u) => u.videoTrack != null);
    if (peer?.videoTrack && remEl) {
      try {
        tracks.video.stop();
      } catch {
        /* ignore */
      }
      peer.videoTrack.play(remEl);
      if (locEl) {
        tracks.video.play(locEl);
      }
      setHasRemoteVideo(true);
    } else {
      try {
        tracks.video.stop();
      } catch {
        /* ignore */
      }
      if (locEl) locEl.innerHTML = "";
      if (remEl) {
        tracks.video.play(remEl);
      }
      setHasRemoteVideo(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function teardown() {
      const client = clientRef.current;
      const tracks = tracksRef.current;
      clientRef.current = null;
      tracksRef.current = null;
      setJoined(false);
      setHasRemoteVideo(false);
      try {
        if (client) await client.leave();
      } catch {
        /* ignore */
      }
      if (tracks) {
        tracks.audio?.close();
        tracks.video?.close();
      }
      const loc = localContainerRef.current;
      const rem = remoteContainerRef.current;
      if (loc) loc.innerHTML = "";
      if (rem) rem.innerHTML = "";
    }

    if (!enabled || !channelName?.trim()) {
      void teardown();
      setJoining(false);
      setError(null);
      return () => {
        cancelled = true;
        void teardown();
        setJoining(false);
      };
    }

    const agoraAppId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    if (!agoraAppId) {
      setError("Set NEXT_PUBLIC_AGORA_APP_ID for video chat.");
      return () => {
        cancelled = true;
      };
    }

    async function init() {
      const channel = channelName?.trim();
      if (!channel) return;

      setJoining(true);
      setError(null);
      await teardown();
      if (cancelled) return;

      try {
        const uidOpt = stableUidFromUserId(userIdKey);
        const qs = new URLSearchParams({ channel });
        if (uidOpt != null) qs.set("uid", String(uidOpt));

        const res = await fetch(`/api/agora/token?${qs.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : "Token request failed"
          );
        }

        const token =
          data.token === null || data.token === undefined || data.token === ""
            ? null
            : String(data.token);
        const uidNum =
          typeof data.uid === "number" && Number.isFinite(data.uid)
            ? data.uid
            : parseInt(String(data.uid ?? ""), 10);
        if (!Number.isFinite(uidNum) || uidNum < 0) {
          throw new Error("Invalid Agora uid from server");
        }
        const uid: number | string = uidNum;

        if (cancelled) return;

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on(
          "user-published",
          async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
            await client.subscribe(user, mediaType);
            const ru = client.remoteUsers.find((u) => u.uid === user.uid);
            if (mediaType === "video") {
              syncVideoLayout();
            }
            if (mediaType === "audio" && ru?.audioTrack) {
              ru.audioTrack.play();
            }
          }
        );

        client.on(
          "user-unpublished",
          (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
            if (mediaType === "video") {
              user.videoTrack?.stop();
            }
            if (mediaType === "audio") {
              user.audioTrack?.stop();
            }
            syncVideoLayout();
          }
        );

        client.on("user-left", (user: IAgoraRTCRemoteUser) => {
          user.videoTrack?.stop();
          user.audioTrack?.stop();
          syncVideoLayout();
        });

        const [audioTrack, videoTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();
        if (cancelled) {
          audioTrack.close();
          videoTrack.close();
          return;
        }
        tracksRef.current = { audio: audioTrack, video: videoTrack };

        await client.join(agoraAppId as string, channel, token, uid);
        if (cancelled) return;

        await client.publish([audioTrack, videoTrack]);

        syncVideoLayout();

        setJoined(true);
        setJoining(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setJoining(false);
          await teardown();
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
      void teardown();
      setJoining(false);
    };
  }, [
    enabled,
    channelName,
    userIdKey,
    localContainerRef,
    remoteContainerRef,
  ]);

  const toggleMute = useCallback(() => {
    const a = tracksRef.current?.audio;
    if (!a) return;
    a.setEnabled(muted);
    setMuted((m) => !m);
  }, [muted]);

  const toggleCamera = useCallback(() => {
    const v = tracksRef.current?.video;
    if (!v) return;
    v.setEnabled(cameraOff);
    setCameraOff((c) => !c);
  }, [cameraOff]);

  return {
    joined,
    joining,
    error,
    muted,
    cameraOff,
    hasRemoteVideo,
    toggleMute,
    toggleCamera,
  };
}
