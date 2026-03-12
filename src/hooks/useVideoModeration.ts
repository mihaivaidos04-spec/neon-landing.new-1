"use client";

import { useEffect, useRef, useCallback } from "react";

const CAPTURE_INTERVAL_MS = 30 * 1000;
const CAPTURE_WIDTH = 160;
const CAPTURE_HEIGHT = 120;
const JPEG_QUALITY = 0.6;

export function useVideoModeration(options: {
  enabled: boolean;
  userId: string | null;
  partnerId: string | null;
  onViolation: () => void;
}) {
  const { enabled, userId, partnerId, onViolation } = options;
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;

  const captureAndCheck = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || !userId) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT);
    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

    try {
      const res = await fetch("/api/moderation/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, partnerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.violation) {
        onViolationRef.current();
      }
    } catch {
      // Ignore network errors – don't disconnect on API failure
    }
  }, [userId, partnerId]);

  useEffect(() => {
    if (!enabled || !userId) return;

    let cancelled = false;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: CAPTURE_WIDTH }, height: { ideal: CAPTURE_HEIGHT } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const video = document.createElement("video");
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;
        videoRef.current = video;

        const canvas = document.createElement("canvas");
        canvas.width = CAPTURE_WIDTH;
        canvas.height = CAPTURE_HEIGHT;
        canvasRef.current = canvas;

        video.play().catch(() => {});

        const interval = setInterval(() => {
          captureAndCheck();
        }, CAPTURE_INTERVAL_MS);
        intervalRef.current = interval;

        captureAndCheck();
      } catch (err) {
        console.warn("[video-moderation] Camera access denied or unavailable:", err);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      videoRef.current = null;
      canvasRef.current = null;
    };
  }, [enabled, userId, captureAndCheck]);

  return {};
}
