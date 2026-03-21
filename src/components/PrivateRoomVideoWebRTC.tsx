"use client";

/**
 * Private 1:1 WebRTC video/audio via Socket.io signaling (offer / answer / ICE).
 * Caller = lexicographically smaller user id; receiver sends answer.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  audio: true,
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 },
  },
};

type SessionDescPayload = { type: RTCSdpType; sdp: string };

type Props = {
  roomId: string;
  myUserId: string;
  peerUserId: string;
  socket: Socket | null;
  socketConnected: boolean;
  onLeave?: () => void;
};

function flushCandidateQueue(
  pc: RTCPeerConnection,
  queue: RTCIceCandidateInit[]
) {
  while (queue.length > 0) {
    const init = queue.shift();
    if (!init) continue;
    void pc.addIceCandidate(init).catch(() => {});
  }
}

export default function PrivateRoomVideoWebRTC({
  roomId,
  myUserId,
  peerUserId,
  socket,
  socketConnected,
  onLeave,
}: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingRemoteIceRef = useRef<RTCIceCandidateInit[]>([]);
  const offerBusyRef = useRef(false);
  const amCallerRef = useRef(false);
  const offerQueueRef = useRef<SessionDescPayload | null>(null);
  const answerQueueRef = useRef<SessionDescPayload | null>(null);
  /** Avoid sending a second offer after the session is up (e.g. duplicate join_room). */
  const sessionEstablishedRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [mediaReady, setMediaReady] = useState(false);
  const [iceGatheringState, setIceGatheringState] =
    useState<RTCIceGatheringState>("new");
  const [connectionState, setConnectionState] =
    useState<RTCPeerConnectionState>("new");
  const [hasRemoteTrack, setHasRemoteTrack] = useState(false);

  const amCaller =
    myUserId && peerUserId ? myUserId.localeCompare(peerUserId) < 0 : false;
  amCallerRef.current = amCaller;

  const showConnectingOverlay =
    iceGatheringState === "gathering" ||
    (!hasRemoteTrack &&
      connectionState !== "failed" &&
      connectionState !== "disconnected" &&
      mediaReady);

  const trySendOffer = useCallback(async () => {
    const pc = pcRef.current;
    const s = socket;
    if (!pc || !s || !amCallerRef.current || offerBusyRef.current) return;
    if (sessionEstablishedRef.current) return;
    if (pc.signalingState !== "stable") return;
    offerBusyRef.current = true;
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      const loc = pc.localDescription;
      if (loc) {
        s.emit("webrtc_offer", {
          roomId,
          sdp: { type: loc.type, sdp: loc.sdp },
        });
      }
    } catch (e) {
      console.error("[WebRTC] createOffer", e);
      setError("Could not start video handshake.");
    } finally {
      offerBusyRef.current = false;
    }
  }, [roomId, socket]);

  useEffect(() => {
    if (!socket || !socketConnected || !roomId || !myUserId || !peerUserId) {
      return;
    }

    let cancelled = false;

    const applyRemoteOffer = async (sdp: SessionDescPayload) => {
      const pc = pcRef.current;
      const s = socket;
      if (!pc || !s) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        flushCandidateQueue(pc, pendingRemoteIceRef.current);
        if (!amCallerRef.current) {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          const loc = pc.localDescription;
          if (loc) {
            s.emit("webrtc_answer", {
              roomId,
              sdp: { type: loc.type, sdp: loc.sdp },
            });
          }
        }
      } catch (e) {
        console.error("[WebRTC] applyRemoteOffer", e);
        setError("Incoming call setup failed.");
      }
    };

    const applyRemoteAnswer = async (sdp: SessionDescPayload) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        flushCandidateQueue(pc, pendingRemoteIceRef.current);
      } catch (e) {
        console.error("[WebRTC] applyRemoteAnswer", e);
        setError("Could not complete connection.");
      }
    };

    const onOffer = (payload: {
      sdp?: SessionDescPayload;
      fromUserId?: string | null;
    }) => {
      if (!payload?.sdp?.sdp || payload.fromUserId === myUserId) return;
      if (!pcRef.current) {
        offerQueueRef.current = payload.sdp;
        return;
      }
      void applyRemoteOffer(payload.sdp);
    };

    const onAnswer = (payload: {
      sdp?: SessionDescPayload;
      fromUserId?: string | null;
    }) => {
      if (!payload?.sdp?.sdp || payload.fromUserId === myUserId) return;
      if (!pcRef.current) {
        answerQueueRef.current = payload.sdp;
        return;
      }
      void applyRemoteAnswer(payload.sdp);
    };

    const onIce = (payload: {
      candidate?: RTCIceCandidateInit | null;
      fromUserId?: string | null;
    }) => {
      if (!payload?.candidate || payload.fromUserId === myUserId) return;
      const pc = pcRef.current;
      const init = payload.candidate;
      if (!pc) {
        pendingRemoteIceRef.current.push(init);
        return;
      }
      if (!pc.remoteDescription) {
        pendingRemoteIceRef.current.push(init);
        return;
      }
      void pc.addIceCandidate(init).catch(() => {});
    };

    const onPeerJoined = () => {
      if (amCallerRef.current) void trySendOffer();
    };

    socket.emit("join_room", roomId);
    socket.on("webrtc_room_peer_joined", onPeerJoined);
    socket.on("webrtc_offer", onOffer);
    socket.on("webrtc_answer", onAnswer);
    socket.on("webrtc_ice_candidate", onIce);

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(
          MEDIA_CONSTRAINTS
        );
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          try {
            await localVideoRef.current.play();
          } catch {
            /* autoplay */
          }
        }

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;
        pendingRemoteIceRef.current = [];

        pc.onicegatheringstatechange = () => {
          setIceGatheringState(pc.iceGatheringState);
        };
        pc.onconnectionstatechange = () => {
          setConnectionState(pc.connectionState);
        };
        pc.onicecandidate = (ev) => {
          if (ev.candidate && socket) {
            socket.emit("webrtc_ice_candidate", {
              roomId,
              candidate: ev.candidate.toJSON(),
            });
          }
        };
        pc.ontrack = (ev) => {
          const [remote] = ev.streams;
          if (remote && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remote;
            sessionEstablishedRef.current = true;
            setHasRemoteTrack(true);
            void remoteVideoRef.current.play().catch(() => {});
          }
        };

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        setIceGatheringState(pc.iceGatheringState);
        setConnectionState(pc.connectionState);
        setMediaReady(true);

        const qOffer = offerQueueRef.current;
        offerQueueRef.current = null;
        if (qOffer) await applyRemoteOffer(qOffer);

        const qAns = answerQueueRef.current;
        answerQueueRef.current = null;
        if (qAns) await applyRemoteAnswer(qAns);

        if (amCallerRef.current) {
          window.setTimeout(() => void trySendOffer(), 400);
        }
      } catch (e) {
        if (!cancelled) {
          const msg =
            e instanceof Error ? e.message : "Camera or microphone denied.";
          setError(msg);
        }
      }
    })();

    return () => {
      cancelled = true;
      socket.off("webrtc_room_peer_joined", onPeerJoined);
      socket.off("webrtc_offer", onOffer);
      socket.off("webrtc_answer", onAnswer);
      socket.off("webrtc_ice_candidate", onIce);

      pcRef.current?.close();
      pcRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      offerQueueRef.current = null;
      answerQueueRef.current = null;
      sessionEstablishedRef.current = false;
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      pendingRemoteIceRef.current = [];
      setMediaReady(false);
      setHasRemoteTrack(false);
      setIceGatheringState("new");
      setConnectionState("new");
    };
  }, [
    socket,
    socketConnected,
    roomId,
    myUserId,
    peerUserId,
    trySendOffer,
  ]);

  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const toggleMute = useCallback(() => {
    const a = streamRef.current?.getAudioTracks()[0];
    if (!a) return;
    a.enabled = muted;
    setMuted((m) => !m);
  }, [muted]);

  const toggleCamera = useCallback(() => {
    const v = streamRef.current?.getVideoTracks()[0];
    if (!v) return;
    v.enabled = cameraOff;
    setCameraOff((c) => !c);
  }, [cameraOff]);

  if (error) {
    return (
      <div className="flex min-h-[50vh] w-full flex-col items-center justify-center rounded-xl border border-fuchsia-500/30 bg-black/80 p-6 text-center text-fuchsia-200/90 shadow-[0_0_24px_rgba(236,72,153,0.15)]">
        <p className="max-w-md text-sm">{error}</p>
        <button
          type="button"
          onClick={() => onLeave?.()}
          className="mt-4 rounded-full border border-fuchsia-500/50 bg-fuchsia-950/40 px-5 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-900/50"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[220px] w-full overflow-hidden rounded-xl border border-fuchsia-500/25 bg-black shadow-[0_0_40px_rgba(168,85,247,0.12)]">
      <div className="absolute inset-0 bg-black">
        <video
          ref={remoteVideoRef}
          className="h-full w-full object-cover"
          playsInline
          autoPlay
          muted={false}
        />
        {!hasRemoteTrack && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-950/40 to-black/80" />
        )}
      </div>

      {showConnectingOverlay && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/55 backdrop-blur-[2px]">
          <div
            className="h-11 w-11 animate-spin rounded-full border-2 border-fuchsia-500/30 border-t-fuchsia-400 shadow-[0_0_20px_rgba(244,114,182,0.55)]"
            aria-hidden
          />
          <p
            className="text-sm font-medium tracking-wide text-fuchsia-100/95"
            style={{
              textShadow:
                "0 0 12px rgba(236,72,153,0.8), 0 0 24px rgba(168,85,247,0.4)",
            }}
          >
            Connecting…
          </p>
          {iceGatheringState === "gathering" && (
            <p className="max-w-xs px-4 text-center text-xs text-white/45">
              Gathering network paths (STUN)
            </p>
          )}
        </div>
      )}

      <div className="absolute bottom-20 right-3 z-30 h-24 w-32 overflow-hidden rounded-lg border-2 border-fuchsia-500/70 bg-black shadow-[0_0_18px_rgba(236,72,153,0.35)] sm:bottom-24 sm:h-28 sm:w-36">
        <video
          ref={localVideoRef}
          className="h-full w-full scale-x-[-1] object-cover"
          playsInline
          autoPlay
          muted
        />
        <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-fuchsia-200/90">
          Self
        </span>
      </div>

      <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        <button
          type="button"
          onClick={toggleMute}
          disabled={!mediaReady}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
            muted
              ? "bg-rose-600/90 text-white shadow-[0_0_16px_rgba(244,63,94,0.45)]"
              : "border border-white/20 bg-black/50 text-white backdrop-blur-md hover:border-fuchsia-400/50 hover:shadow-[0_0_12px_rgba(236,72,153,0.3)]"
          } ${!mediaReady ? "cursor-not-allowed opacity-40" : ""}`}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.35s5.42-2.35 5.91-5.35c.1-.6-.39-1.14-1-1.14z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={toggleCamera}
          disabled={!mediaReady}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
            cameraOff
              ? "bg-rose-600/90 text-white shadow-[0_0_16px_rgba(244,63,94,0.45)]"
              : "border border-white/20 bg-black/50 text-white backdrop-blur-md hover:border-fuchsia-400/50 hover:shadow-[0_0_12px_rgba(236,72,153,0.3)]"
          } ${!mediaReady ? "cursor-not-allowed opacity-40" : ""}`}
          title={cameraOff ? "Camera on" : "Camera off"}
        >
          {cameraOff ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M18 10.48V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4.48l4 3.98v-11l-4 3.98zm-2-.79V18H4V6h12v3.69z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
            </svg>
          )}
        </button>
        {onLeave && (
          <button
            type="button"
            onClick={onLeave}
            className="flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.45)] transition hover:brightness-110"
          >
            Leave
          </button>
        )}
      </div>
    </div>
  );
}
