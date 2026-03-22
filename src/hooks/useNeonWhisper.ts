"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { captureVideoFrameFromContainer } from "../lib/capture-video-frame";

const INTERVAL_MS = 15_000;
const FIRST_DELAY_MS = 4_000;

export type TranscriptBufferRef = {
  /** Append a finalized speech segment (e.g. from Web Speech API). */
  push: (text: string) => void;
  /** Plaintext from the last 30s, space-joined. */
  getRecent: () => string;
  clear: () => void;
};

export function createTranscriptBuffer(windowMs = 30_000): TranscriptBufferRef {
  const entries: { t: number; text: string }[] = [];
  return {
    push(text: string) {
      const trimmed = text.trim();
      if (!trimmed) return;
      const now = Date.now();
      entries.push({ t: now, text: trimmed });
      const cutoff = now - windowMs;
      while (entries.length && entries[0].t < cutoff) entries.shift();
    },
    getRecent() {
      const now = Date.now();
      const cutoff = now - windowMs;
      return entries
        .filter((e) => e.t >= cutoff)
        .map((e) => e.text)
        .join(" ");
    },
    clear() {
      entries.length = 0;
    },
  };
}

type UseNeonWhisperOptions = {
  remoteContainerRef: React.RefObject<HTMLElement | null>;
  /** When true, polls and calls the API. */
  active: boolean;
  transcriptBuffer: TranscriptBufferRef;
};

export function useNeonWhisper({
  remoteContainerRef,
  active,
  transcriptBuffer,
}: UseNeonWhisperOptions): {
  tip: string | null;
  loading: boolean;
  error: string | null;
  dismissTip: () => void;
} {
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const dismissTip = useCallback(() => {
    setTip(null);
    setError(null);
  }, []);

  const runOnce = useCallback(async () => {
    if (inFlightRef.current) return;
    const el = remoteContainerRef.current;
    const imageBase64 = captureVideoFrameFromContainer(el, {
      maxWidth: 512,
      maxHeight: 384,
      quality: 0.7,
    });
    if (!imageBase64) return;

    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const transcript = transcriptBuffer.getRecent();
      const res = await fetch("/api/neon-whisper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, transcript }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        tip?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }
      if (data.tip) setTip(data.tip);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [remoteContainerRef, transcriptBuffer]);

  useEffect(() => {
    if (!active) {
      setTip(null);
      setLoading(false);
      setError(null);
      return;
    }

    let interval: ReturnType<typeof setInterval> | null = null;
    const first = setTimeout(() => {
      void runOnce();
      interval = setInterval(() => void runOnce(), INTERVAL_MS);
    }, FIRST_DELAY_MS);

    return () => {
      clearTimeout(first);
      if (interval) clearInterval(interval);
    };
  }, [active, runOnce]);

  return { tip, loading, error, dismissTip };
}
