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
  enabled: boolean;
  onInsufficientBalance?: () => void;
};

export default function LiveSubtitles({
  locale,
  enabled,
  onInsufficientBalance,
}: Props) {
  const [subtitle, setSubtitle] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSubtitle("(Speech recognition not supported)");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LOCALE_TO_LANG[locale];
    recognitionRef.current = recognition;

    recognition.onresult = (event: { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } } }) => {
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
          translate(text, recognition.lang).then((t) => setSubtitle(t));
        } else {
          setSubtitle(text);
        }
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setSubtitle(""), 4000);
      }
    };

    recognition.onerror = (e: { error?: string }) => {
      setIsListening(false);
      if (e.error === "not-allowed") {
        setSubtitle(getContentT(locale).liveTranslationMicDenied);
      }
    };

    recognition.start();
    setIsListening(true);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      try {
        recognition.stop();
      } catch {}
      recognitionRef.current = null;
      setIsListening(false);
      setSubtitle("");
    };
  }, [enabled, locale, translate]);

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
