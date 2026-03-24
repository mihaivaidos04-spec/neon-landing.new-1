"use client";

import { useEffect, useRef } from "react";

const MODEL_BASE = "https://unpkg.com/face-api.js@0.22.2/weights";
const INTERVAL_MS = 2800;
const MISSES_TO_PAUSE = 4;
const HITS_TO_RESUME = 2;

let modelsLoaded: Promise<void> | null = null;

function loadFaceModels() {
  if (!modelsLoaded) {
    modelsLoaded = (async () => {
      const faceapi = await import("face-api.js");
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_BASE);
    })();
  }
  return modelsLoaded;
}

/**
 * Periodically checks the local camera track for a visible face (TinyFaceDetector).
 * If none for several frames → pause publishing; when face returns → resume.
 * Does not detect NSFW — only face presence (ceiling / away-from-camera).
 */
export function useLocalFaceGuard(opts: {
  enabled: boolean;
  videoTrack: MediaStreamTrack | null;
  onPausePublishing: () => void;
  onResumePublishing: () => void;
}) {
  const pauseRef = useRef(opts.onPausePublishing);
  const resumeRef = useRef(opts.onResumePublishing);
  pauseRef.current = opts.onPausePublishing;
  resumeRef.current = opts.onResumePublishing;

  useEffect(() => {
    if (!opts.enabled || !opts.videoTrack) return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const misses = { n: 0 };
    const hits = { n: 0 };
    let pausedByGuard = false;

    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");

    void (async () => {
      try {
        await loadFaceModels();
        if (cancelled) return;
        const mst = opts.videoTrack!;
        video.srcObject = new MediaStream([mst]);
        await video.play().catch(() => {});
      } catch (e) {
        console.warn("[face-guard] init failed", e);
        return;
      }

      const tick = async () => {
        if (cancelled) return;
        if (video.readyState < 2 || video.videoWidth < 16) return;

        try {
          const faceapi = await import("face-api.js");
          const options = new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.45,
          });
          const faces = await faceapi.detectAllFaces(video, options);
          const hasFace = faces.length > 0;

          if (pausedByGuard) {
            if (hasFace) {
              hits.n += 1;
              if (hits.n >= HITS_TO_RESUME) {
                pausedByGuard = false;
                misses.n = 0;
                hits.n = 0;
                resumeRef.current();
              }
            } else {
              hits.n = 0;
            }
          } else {
            if (hasFace) {
              misses.n = 0;
            } else {
              misses.n += 1;
              if (misses.n >= MISSES_TO_PAUSE) {
                pausedByGuard = true;
                hits.n = 0;
                pauseRef.current();
              }
            }
          }
        } catch (err) {
          console.warn("[face-guard] detect failed", err);
        }
      };

      intervalId = setInterval(() => void tick(), INTERVAL_MS);
    })();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      video.srcObject = null;
    };
  }, [opts.enabled, opts.videoTrack]);
}
