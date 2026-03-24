"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionState,
  LocalVideoTrack,
  Room,
  RoomEvent,
  Track,
  createLocalTracks,
  type LocalAudioTrack,
  type LocalVideoTrack as LocalVideoTrackType,
} from "livekit-client";

export type LiveKitTheaterState = {
  joined: boolean;
  joining: boolean;
  error: string | null;
  muted: boolean;
  cameraOff: boolean;
  hasRemoteVideo: boolean;
  /** True when another participant is in the room (Neon Companion / peer). */
  hasRemotePeer: boolean;
  cameraMediaTrack: MediaStreamTrack | null;
  toggleMute: () => void;
  toggleCamera: () => void;
  setCameraEnabled: (enabled: boolean) => void;
  /** Connected LiveKit room — use with RoomContext + VideoConference for remote stage. */
  room: Room | null;
};

type TracksBundle = {
  audio: LocalAudioTrack;
  camera: LocalVideoTrackType;
  published: LocalVideoTrackType;
};

type UseLiveKitTheaterOptions = {
  roomName: string | null;
  enabled: boolean;
  identityKey: string;
  localContainerRef: React.RefObject<HTMLDivElement | null>;
  remoteContainerRef: React.RefObject<HTMLDivElement | null>;
  /**
   * When set, publish this MediaStreamTrack as video instead of the camera track.
   * Mic stays the same; camera track stays alive for Jeeliz processing.
   */
  replaceVideoWithTrack: MediaStreamTrack | null;
};

function stableIdentity(identityKey: string): string {
  if (!identityKey.trim()) return `guest-${Math.random().toString(36).slice(2, 10)}`;
  return identityKey.slice(0, 128);
}

function roomHasRemoteVideo(room: Room): boolean {
  for (const p of room.remoteParticipants.values()) {
    const pub = p.getTrackPublication(Track.Source.Camera);
    if (pub?.isSubscribed && pub.track) return true;
  }
  return false;
}

function ensureTheaterVideo(
  container: HTMLElement | null,
  slot: "main" | "pip"
): HTMLVideoElement | null {
  if (!container) return null;
  const sel = `video[data-theater-livekit="${slot}"]`;
  let v = container.querySelector(sel) as HTMLVideoElement | null;
  if (!v) {
    v = document.createElement("video");
    v.setAttribute("data-theater-livekit", slot);
    v.autoplay = true;
    v.playsInline = true;
    v.muted = true;
    v.setAttribute("playsinline", "true");
    v.className = "h-full w-full object-cover object-center";
    container.appendChild(v);
  }
  return v;
}

function removeTheaterVideo(container: HTMLElement | null, slot: "main" | "pip") {
  if (!container) return;
  container.querySelector(`video[data-theater-livekit="${slot}"]`)?.remove();
}

/**
 * LiveKit WebRTC theater: join room, publish mic + camera, subscribe to remote.
 * Token from GET /api/livekit/token. Low-latency-oriented Room options.
 */
export function useLiveKitTheater({
  roomName,
  enabled,
  identityKey,
  localContainerRef,
  remoteContainerRef,
  replaceVideoWithTrack,
}: UseLiveKitTheaterOptions): LiveKitTheaterState {
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [hasRemotePeer, setHasRemotePeer] = useState(false);
  const [cameraMediaTrack, setCameraMediaTrack] = useState<MediaStreamTrack | null>(null);
  const [room, setRoom] = useState<Room | null>(null);

  const roomRef = useRef<Room | null>(null);
  const tracksRef = useRef<TracksBundle | null>(null);
  const joinedRef = useRef(false);

  useEffect(() => {
    joinedRef.current = joined;
  }, [joined]);

  function updateRemoteFlags(r: Room) {
    const peer = r.remoteParticipants.size > 0;
    setHasRemotePeer(peer);
    setHasRemoteVideo(peer && roomHasRemoteVideo(r));
  }

  /** Solo: local on main stage. With peer: remote via VideoConference + local in PiP (see VideoBridge). */
  function syncVideoLayout() {
    const r = roomRef.current;
    const tracks = tracksRef.current;
    const remEl = remoteContainerRef.current;
    const locEl = localContainerRef.current;
    if (!r || !tracks?.published || !remEl) return;

    const peer = r.remoteParticipants.size > 0;
    const { published } = tracks;

    published.detach();

    if (peer) {
      removeTheaterVideo(remEl, "main");
      const pip = ensureTheaterVideo(locEl, "pip");
      if (pip) published.attach(pip);
    } else {
      removeTheaterVideo(locEl, "pip");
      const main = ensureTheaterVideo(remEl, "main");
      if (main) published.attach(main);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function teardown() {
      const r = roomRef.current;
      roomRef.current = null;
      setRoom(null);
      tracksRef.current = null;
      setJoined(false);
      joinedRef.current = false;
      setHasRemoteVideo(false);
      setHasRemotePeer(false);
      setCameraMediaTrack(null);
      try {
        if (r && r.state !== ConnectionState.Disconnected) await r.disconnect(true);
      } catch {
        /* ignore */
      }
      const loc = localContainerRef.current;
      const rem = remoteContainerRef.current;
      if (loc) {
        removeTheaterVideo(loc, "pip");
      }
      if (rem) {
        removeTheaterVideo(rem, "main");
      }
    }

    if (!enabled || !roomName?.trim()) {
      void teardown();
      setJoining(false);
      setError(null);
      return () => {
        cancelled = true;
        void teardown();
        setJoining(false);
      };
    }

    const liveKitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL?.trim() ?? "";
    if (!liveKitUrl) {
      setError("Set NEXT_PUBLIC_LIVEKIT_URL for LiveKit (e.g. wss://your-project.livekit.cloud).");
      return () => {
        cancelled = true;
      };
    }

    async function init() {
      const name = roomName?.trim();
      if (!name) return;

      setJoining(true);
      setError(null);
      await teardown();
      if (cancelled) return;

      try {
        const identity = stableIdentity(identityKey);
        const qs = new URLSearchParams({ room: name, identity });
        const res = await fetch(`/api/livekit/token?${qs.toString()}`);
        const data = (await res.json().catch(() => ({}))) as { error?: string; token?: string };
        if (!res.ok) {
          throw new Error(typeof data.error === "string" ? data.error : "LiveKit token request failed");
        }
        if (!data.token || typeof data.token !== "string") {
          throw new Error("Invalid token response from server");
        }
        if (cancelled) return;

        const lkRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
          disconnectOnPageLeave: false,
          videoCaptureDefaults: {
            resolution: { width: 1280, height: 720 },
            facingMode: "user",
          },
          publishDefaults: {
            videoCodec: "vp8",
            simulcast: true,
          },
        });
        roomRef.current = lkRoom;
        setRoom(lkRoom);

        lkRoom.on(RoomEvent.ParticipantConnected, () => {
          updateRemoteFlags(lkRoom);
          syncVideoLayout();
        });
        lkRoom.on(RoomEvent.ParticipantDisconnected, () => {
          updateRemoteFlags(lkRoom);
          syncVideoLayout();
        });
        lkRoom.on(RoomEvent.TrackSubscribed, (_track, _pub, _p) => {
          updateRemoteFlags(lkRoom);
          syncVideoLayout();
        });
        lkRoom.on(RoomEvent.TrackUnsubscribed, () => {
          updateRemoteFlags(lkRoom);
          syncVideoLayout();
        });

        await lkRoom.connect(liveKitUrl, data.token, {
          autoSubscribe: true,
        });
        if (cancelled) return;

        const created = await createLocalTracks({
          audio: true,
          video: true,
        });
        const audioTrack = created.find((t) => t.kind === Track.Kind.Audio) as LocalAudioTrack | undefined;
        const cameraTrack = created.find((t) => t.kind === Track.Kind.Video) as LocalVideoTrackType | undefined;
        if (!audioTrack || !cameraTrack) {
          created.forEach((t) => t.stop());
          throw new Error("Could not acquire camera and microphone");
        }
        if (cancelled) {
          audioTrack.stop();
          cameraTrack.stop();
          return;
        }

        const ms = cameraTrack.mediaStreamTrack;
        setCameraMediaTrack(ms);

        let published: LocalVideoTrackType = cameraTrack;
        if (replaceVideoWithTrack) {
          published = new LocalVideoTrack(replaceVideoWithTrack, undefined, true);
        }

        tracksRef.current = {
          audio: audioTrack,
          camera: cameraTrack,
          published,
        };

        await lkRoom.localParticipant.publishTrack(audioTrack);
        await lkRoom.localParticipant.publishTrack(published);
        if (cancelled) return;

        updateRemoteFlags(lkRoom);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- replaceVideoWithTrack: swap effect below
  }, [enabled, roomName, identityKey, localContainerRef, remoteContainerRef]);

  useEffect(() => {
    if (!joinedRef.current) return;
    const r = roomRef.current;
    const tracks = tracksRef.current;
    if (!r?.localParticipant || !tracks?.audio || !tracks?.camera) return;

    let cancelled = false;

    void (async () => {
      const override = replaceVideoWithTrack;
      const { camera } = tracks;
      let { published } = tracks;
      const publishedIsCamera = published === camera;

      try {
        if (override) {
          if (publishedIsCamera) {
            await r.localParticipant.unpublishTrack(published);
            const custom = new LocalVideoTrack(override, undefined, true);
            tracks.published = custom;
            await r.localParticipant.publishTrack(custom);
          } else {
            const prev = published;
            await r.localParticipant.unpublishTrack(prev);
            prev.stop();
            const custom = new LocalVideoTrack(override, undefined, true);
            tracks.published = custom;
            await r.localParticipant.publishTrack(custom);
          }
        } else if (!publishedIsCamera) {
          const prev = published;
          await r.localParticipant.unpublishTrack(prev);
          prev.stop();
          tracks.published = camera;
          await r.localParticipant.publishTrack(camera);
        }
        if (!cancelled) syncVideoLayout();
      } catch (e) {
        console.error("[useLiveKitTheater] video swap", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [joined, replaceVideoWithTrack]);

  const toggleMute = useCallback(() => {
    const r = roomRef.current;
    if (!r) return;
    const nextMuted = !muted;
    void r.localParticipant.setMicrophoneEnabled(!nextMuted);
    setMuted(nextMuted);
  }, [muted]);

  const toggleCamera = useCallback(() => {
    const r = roomRef.current;
    if (!r) return;
    const nextOff = !cameraOff;
    void r.localParticipant.setCameraEnabled(!nextOff);
    setCameraOff(nextOff);
  }, [cameraOff]);

  const setCameraEnabled = useCallback((cameraEnabled: boolean) => {
    const r = roomRef.current;
    if (!r) return;
    void r.localParticipant.setCameraEnabled(cameraEnabled);
    setCameraOff(!cameraEnabled);
  }, []);

  return {
    joined,
    joining,
    error,
    muted,
    cameraOff,
    hasRemoteVideo,
    hasRemotePeer,
    cameraMediaTrack,
    toggleMute,
    toggleCamera,
    setCameraEnabled,
    room,
  };
}
