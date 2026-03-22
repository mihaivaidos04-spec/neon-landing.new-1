"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";

const LOCALE_TO_LANG: Record<ContentLocale, string> = {
  ro: "ro-RO",
  en: "en-US",
  de: "de-DE",
  it: "it-IT",
  es: "es-ES",
  fr: "fr-FR",
  pt: "pt-PT",
  nl: "nl-NL",
  pl: "pl-PL",
  tr: "tr-TR",
};

const LOCALE_TO_TRANSLATE: Record<ContentLocale, string> = {
  ro: "ro",
  en: "en",
  de: "de",
  it: "it",
  es: "es",
  fr: "fr",
  pt: "pt",
  nl: "nl",
  pl: "pl",
  tr: "tr",
};

type Props = {
  locale: ContentLocale;
  /** Show subtitles UI + listen to mic */
  enabled: boolean;
  /** Listen for speech without showing subtitle bar (e.g. Neon Whisper transcript buffer) */
  listenOnly?: boolean;
  onInsufficientBalance?: () => void;
  /** Final speech segments from the local mic (raw, before translation). */
  onTranscriptFinal?: (text: string) => void;
};

export default function LiveSubtitles({
  locale,
  enabled,
  listenOnly = false,
  onInsufficientBalance,
  onTranscriptFinal,
}: Props) {
  const [subtitle, setSubtitle] = useState("");
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTranscriptFinalRef = useRef(onTranscriptFinal);
  onTranscriptFinalRef.current = onTranscriptFinal;

  const translate = useCallback(
    async (text: string, sourceLang: string): Promise<string> => {
      if (!text.trim()) return text;
      const target = LOCALE_TO_TRANSLATE[locale];
      const src = sourceLang.split("-")[0];
      if (src === target) return text;
      try {
        const res = await fetch(
          `/api/translate?text=${encodeURIComponent(text)}&from=${src}&to=${target}`
        );
        const data = await res.json();
        return data.translated ?? text;
      } catch {
        return text;
      }
    },
    [locale]
  );

  const shouldListen = enabled || listenOnly;

  useEffect(() => {
    if (!shouldListen || typeof window === "undefined") return;

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (enabled) setSubtitle("(Speech recognition not supported)");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LOCALE_TO_LANG[locale];
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let final = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      const text = (final || interim).trim();
      if (text) {
        if (final) {
          const rawFinal = final.trim();
          if (rawFinal) onTranscriptFinalRef.current?.(rawFinal);
          if (enabled) {
            translate(text, recognition.lang).then((t) => setSubtitle(t));
          }
        } else if (enabled) {
          setSubtitle(text);
        }
        if (enabled) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => setSubtitle(""), 4000);
        }
      }
    };

    recognition.onerror = (e: { error?: string }) => {
      if (e.error === "not-allowed") {
        if (enabled) {
          setSubtitle(getContentT(locale).liveTranslationMicDenied);
        }
      }
    };

    recognition.start();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
      setSubtitle("");
    };
  }, [enabled, listenOnly, shouldListen, locale, translate]);

  if (!enabled || !subtitle) return null;

  return (
    <div
      className="absolute bottom-4 left-4 right-4 z-10 px-4 py-2 text-center"
      role="region"
      aria-live="polite"
      aria-label="Live subtitles"
    >
      <p
        className="inline-block max-w-full rounded-lg bg-black/75 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
      >
        {subtitle}
      </p>
    </div>
  );
}

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [i: number]: { isFinal: boolean; 0: { transcript: string } };
  };
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
};
