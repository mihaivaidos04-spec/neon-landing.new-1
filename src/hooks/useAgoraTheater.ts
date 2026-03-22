"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AgoraRTC, {
  type IAgoraRTCRemoteUser,
  type ICameraVideoTrack,
  type ILocalVideoTrack,
  type IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";

export type AgoraTheaterState = {
  joined: boolean;
  joining: boolean;
  error: string | null;
  muted: boolean;
  cameraOff: boolean;
  hasRemoteVideo: boolean;
  /** Raw camera MediaStreamTrack (for Jeeliz / processing). Null when not joined. */
  cameraMediaTrack: MediaStreamTrack | null;
  toggleMute: () => void;
  toggleCamera: () => void;
  setCameraEnabled: (enabled: boolean) => void;
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

type TracksBundle = {
  audio: IMicrophoneAudioTrack;
  camera: ICameraVideoTrack;
  /** What is currently published + played locally (camera or custom). */
  published: ILocalVideoTrack;
};

type UseAgoraTheaterOptions = {
  channelName: string | null;
  enabled: boolean;
  userIdKey: string;
  localContainerRef: React.RefObject<HTMLDivElement | null>;
  remoteContainerRef: React.RefObject<HTMLDivElement | null>;
  /**
   * When non-null, publish this MediaStreamTrack as video instead of the raw Agora camera.
   * Mic is unchanged; the Agora camera track stays alive as the usual source for Jeeliz.
   */
  replaceVideoWithTrack: MediaStreamTrack | null;
};

/**
 * Agora RTC for main theater: join, publish mic + video, subscribe to remote.
 * Token from /api/agora/token; null token when AGORA_APP_CERTIFICATE is unset (testing).
 */
export function useAgoraTheater({
  channelName,
  enabled,
  userIdKey,
  localContainerRef,
  remoteContainerRef,
  replaceVideoWithTrack,
}: UseAgoraTheaterOptions): AgoraTheaterState {
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [cameraMediaTrack, setCameraMediaTrack] = useState<MediaStreamTrack | null>(null);

  const clientRef = useRef<ReturnType<typeof AgoraRTC.createClient> | null>(null);
  const tracksRef = useRef<TracksBundle | null>(null);
  const joinedRef = useRef(false);

  useEffect(() => {
    joinedRef.current = joined;
  }, [joined]);

  /** Alone: local camera fills the large (remote) stage. With a peer: remote in large, local in PiP. */
  function syncVideoLayout() {
    const client = clientRef.current;
    const tracks = tracksRef.current;
    const remEl = remoteContainerRef.current;
    const locEl = localContainerRef.current;
    if (!client || !tracks?.published || !remEl) return;

    const peer = client.remoteUsers.find((u) => u.videoTrack != null);
    if (peer?.videoTrack && remEl) {
      try {
        tracks.published.stop();
      } catch {
        /* ignore */
      }
      peer.videoTrack.play(remEl);
      if (locEl) {
        tracks.published.play(locEl);
      }
      setHasRemoteVideo(true);
    } else {
      try {
        tracks.published.stop();
      } catch {
        /* ignore */
      }
      if (locEl) locEl.innerHTML = "";
      if (remEl) {
        tracks.published.play(remEl);
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
      joinedRef.current = false;
      setHasRemoteVideo(false);
      setCameraMediaTrack(null);
      try {
        if (client) await client.leave();
      } catch {
        /* ignore */
      }
      if (tracks) {
        tracks.audio?.close();
        if (tracks.published && tracks.published !== tracks.camera) {
          tracks.published.close();
        }
        tracks.camera?.close();
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

        const [audioTrack, cameraVideoTrack] = await Promise.all([
          AgoraRTC.createMicrophoneAudioTrack(),
          AgoraRTC.createCameraVideoTrack(),
        ]);
        if (cancelled) {
          audioTrack.close();
          cameraVideoTrack.close();
          return;
        }

        const ms = cameraVideoTrack.getMediaStreamTrack();
        setCameraMediaTrack(ms);

        let published: ILocalVideoTrack = cameraVideoTrack;
        if (replaceVideoWithTrack) {
          published = AgoraRTC.createCustomVideoTrack({
            mediaStreamTrack: replaceVideoWithTrack,
          });
        }

        tracksRef.current = {
          audio: audioTrack,
          camera: cameraVideoTrack,
          published,
        };

        await client.join(agoraAppId as string, channel, token, uid);
        if (cancelled) return;

        await client.publish([audioTrack, published]);

        syncVideoLayout();

        setJoined(true);
        joinedRef.current = true;
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
    // replaceVideoWithTrack intentionally omitted: first join uses initial value; swaps handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid full re-join when processed track appears
  }, [enabled, channelName, userIdKey, localContainerRef, remoteContainerRef]);

  /** Swap published video between Agora camera and a custom MediaStreamTrack (e.g. Jeeliz canvas). */
  useEffect(() => {
    if (!joinedRef.current) return;
    const client = clientRef.current;
    const tracks = tracksRef.current;
    if (!client || !tracks?.audio || !tracks?.camera) return;

    let cancelled = false;

    void (async () => {
      const override = replaceVideoWithTrack;
      const { camera } = tracks;
      let { published } = tracks;

      const publishedIsCamera = published === camera;

      try {
        if (override) {
          if (publishedIsCamera) {
            await client.unpublish([published]);
            const custom = AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: override });
            tracks.published = custom;
            await client.publish([custom]);
          } else {
            const prev = published;
            await client.unpublish([prev]);
            prev.close();
            const custom = AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: override });
            tracks.published = custom;
            await client.publish([custom]);
          }
        } else {
          if (!publishedIsCamera) {
            const prev = published;
            await client.unpublish([prev]);
            prev.close();
            tracks.published = camera;
            await client.publish([camera]);
          }
        }
        if (!cancelled) syncVideoLayout();
      } catch (e) {
        console.error("[useAgoraTheater] video swap", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [joined, replaceVideoWithTrack]);

  const toggleMute = useCallback(() => {
    const a = tracksRef.current?.audio;
    if (!a) return;
    a.setEnabled(muted);
    setMuted((m) => !m);
  }, [muted]);

  const toggleCamera = useCallback(() => {
    const v = tracksRef.current?.published;
    if (!v) return;
    v.setEnabled(cameraOff);
    setCameraOff((c) => !c);
  }, [cameraOff]);

  const setCameraEnabled = useCallback((cameraEnabled: boolean) => {
    const v = tracksRef.current?.published;
    if (!v) return;
    v.setEnabled(cameraEnabled);
    setCameraOff(!cameraEnabled);
  }, []);

  return {
    joined,
    joining,
    error,
    muted,
    cameraOff,
    hasRemoteVideo,
    cameraMediaTrack,
    toggleMute,
    toggleCamera,
    setCameraEnabled,
  };
}
