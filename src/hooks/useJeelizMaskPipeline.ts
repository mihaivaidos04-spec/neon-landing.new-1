"use client";

import { useEffect, useRef, useState } from "react";
import type { JeelizCanvas2DHelperInstance, JeelizDetectState, JeelizReadySpec } from "../types/jeeliz-facefilter";
import {
  DETECT_THRESHOLD,
  drawAnonymousMask,
  drawBeautyOverlay,
  drawNeonGlasses,
  type FaceMaskId,
} from "../lib/face-masks";

const JEELIZ_SCRIPT =
  "https://cdn.jsdelivr.net/gh/jeeliz/jeelizFaceFilter@master/dist/jeelizFaceFilter.js";
const JEELIZ_NN_PATH =
  "https://cdn.jsdelivr.net/gh/jeeliz/jeelizFaceFilter@master/neuralNets/";
const HELPER_SCRIPT = "/vendor/jeeliz/JeelizCanvas2DHelper.js";

const CANVAS_W = 640;
const CANVAS_H = 480;

let scriptsLoadPromise: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

function ensureJeelizLoaded(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.JEELIZFACEFILTER && window.JeelizCanvas2DHelper) {
    return Promise.resolve();
  }
  if (!scriptsLoadPromise) {
    scriptsLoadPromise = loadScript(JEELIZ_SCRIPT).then(() => loadScript(HELPER_SCRIPT));
  }
  return scriptsLoadPromise;
}

/**
 * Runs Jeeliz FaceFilter on a camera MediaStreamTrack, draws AR overlays, returns a processed video track for WebRTC.
 */
export function useJeelizMaskPipeline(
  cameraTrack: MediaStreamTrack | null,
  mask: FaceMaskId,
  enabled: boolean
): {
  outputVideoTrack: MediaStreamTrack | null;
  error: string | null;
  ready: boolean;
} {
  const [outputVideoTrack, setOutputVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const maskRef = useRef(mask);
  maskRef.current = mask;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cvdRef = useRef<JeelizCanvas2DHelperInstance | null>(null);
  const captureStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText =
      "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0.02;pointer-events:none;";

    const video = document.createElement("video");
    video.muted = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.playsInline = true;
    video.style.cssText = canvas.style.cssText;

    document.body.append(canvas, video);
    canvasRef.current = canvas;
    videoRef.current = video;

    return () => {
      canvas.remove();
      video.remove();
      canvasRef.current = null;
      videoRef.current = null;
    };
  }, []);

  const needsPipeline = Boolean(enabled && mask !== "none" && cameraTrack);

  useEffect(() => {
    if (!needsPipeline) {
      setReady(false);
      setError(null);
      captureStreamRef.current?.getVideoTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          /* ignore */
        }
      });
      captureStreamRef.current = null;
      setOutputVideoTrack(null);
      cvdRef.current = null;

      void (async () => {
        try {
          await window.JEELIZFACEFILTER?.destroy();
        } catch {
          /* ignore */
        }
      })();
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const sourceTrack = cameraTrack;
    if (!canvas || !video || !sourceTrack) return;

    let cancelled = false;

    void (async () => {
      try {
        await ensureJeelizLoaded();
        if (cancelled) return;

        const JF = window.JEELIZFACEFILTER;
        const Helper = window.JeelizCanvas2DHelper;
        if (!JF || !Helper) {
          throw new Error("Jeeliz scripts missing");
        }

        try {
          await JF.destroy();
        } catch {
          /* fresh start */
        }
        if (cancelled) return;

        video.srcObject = new MediaStream([sourceTrack]);
        await video.play().catch(() => {});

        if (cancelled) return;

        const maskRefLocal = maskRef;
        let cvd: JeelizCanvas2DHelperInstance | null = null;

        const ok = JF.init({
          canvas,
          NNCPath: JEELIZ_NN_PATH,
          videoSettings: { videoElement: video },
          followZRot: true,
          maxFacesDetected: 1,
          callbackReady: (errCode: string | false | null, spec?: JeelizReadySpec) => {
            if (cancelled) return;
            if (errCode) {
              setError(typeof errCode === "string" ? errCode : "Jeeliz init failed");
              setReady(false);
              return;
            }
            if (!spec) return;
            try {
              cvd = Helper(spec);
              cvdRef.current = cvd;
            } catch (e) {
              setError(e instanceof Error ? e.message : "Canvas2D helper failed");
              setReady(false);
              return;
            }

            const stream = canvas.captureStream(30);
            captureStreamRef.current = stream;
            const vt = stream.getVideoTracks()[0] ?? null;
            if (vt) setOutputVideoTrack(vt);
            setError(null);
            setReady(true);
          },
          callbackTrack: (detectState: JeelizDetectState) => {
            if (cancelled || !cvd) return;
            const ctx = cvd.ctx;
            const cw = cvd.canvas.width;
            const ch = cvd.canvas.height;
            ctx.clearRect(0, 0, cw, ch);

            const m = maskRefLocal.current;
            if (detectState.detected > DETECT_THRESHOLD) {
              const face = cvd.getCoordinates(detectState);
              if (m === "anonymous") drawAnonymousMask(ctx, face);
              else if (m === "neon_glasses") drawNeonGlasses(ctx, face);
              else if (m === "beauty") drawBeautyOverlay(ctx, face, cw, ch);
            }
            cvd.update_canvasTexture();
            cvd.draw();
          },
        });

        if (!ok && !cancelled) {
          setError("Jeeliz init rejected");
          setReady(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setReady(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [needsPipeline, cameraTrack]);

  useEffect(() => {
    if (!outputVideoTrack || !cameraTrack) return;
    const video = videoRef.current;
    const JF = window.JEELIZFACEFILTER;
    if (!video || !JF || !ready) return;
    video.srcObject = new MediaStream([cameraTrack]);
    void video.play().catch(() => {});
    try {
      JF.update_videoElement?.(video, () => {});
    } catch {
      /* optional API */
    }
  }, [cameraTrack, outputVideoTrack, ready]);

  return { outputVideoTrack, error, ready };
}
