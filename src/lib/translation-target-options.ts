/** BCP-47 for SpeechRecognition; short code for /api/translate `to` / `from` prefixes. */
export type TranslationTargetOption = {
  code: string;
  bcp47: string;
  label: string;
  flag: string;
};

/** Top languages for “Translate to” (MyMemory supports common ISO pairs). */
export const TRANSLATION_TARGET_OPTIONS: TranslationTargetOption[] = [
  { code: "en", bcp47: "en-US", label: "English", flag: "🇺🇸" },
  { code: "ro", bcp47: "ro-RO", label: "Romanian", flag: "🇷🇴" },
  { code: "es", bcp47: "es-ES", label: "Spanish", flag: "🇲🇽" },
  { code: "pt", bcp47: "pt-BR", label: "Portuguese (BR)", flag: "🇧🇷" },
  { code: "fr", bcp47: "fr-FR", label: "French", flag: "🇫🇷" },
  { code: "de", bcp47: "de-DE", label: "German", flag: "🇩🇪" },
  { code: "it", bcp47: "it-IT", label: "Italian", flag: "🇮🇹" },
  { code: "ja", bcp47: "ja-JP", label: "Japanese", flag: "🇯🇵" },
  { code: "ko", bcp47: "ko-KR", label: "Korean", flag: "🇰🇷" },
  { code: "hi", bcp47: "hi-IN", label: "Hindi", flag: "🇮🇳" },
  { code: "id", bcp47: "id-ID", label: "Indonesian", flag: "🇮🇩" },
  { code: "tl", bcp47: "fil-PH", label: "Filipino", flag: "🇵🇭" },
  { code: "nl", bcp47: "nl-NL", label: "Dutch", flag: "🇳🇱" },
  { code: "pl", bcp47: "pl-PL", label: "Polish", flag: "🇵🇱" },
  { code: "tr", bcp47: "tr-TR", label: "Turkish", flag: "🇹🇷" },
  { code: "ar", bcp47: "ar-SA", label: "Arabic", flag: "🇸🇦" },
  { code: "vi", bcp47: "vi-VN", label: "Vietnamese", flag: "🇻🇳" },
  { code: "th", bcp47: "th-TH", label: "Thai", flag: "🇹🇭" },
  { code: "uk", bcp47: "uk-UA", label: "Ukrainian", flag: "🇺🇦" },
  { code: "ru", bcp47: "ru-RU", label: "Russian", flag: "🇷🇺" },
];

export const TRANSLATION_TARGET_STORAGE_KEY = "neon_translate_to";

export function getStoredTranslationTargetCode(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(TRANSLATION_TARGET_STORAGE_KEY)?.trim();
    if (raw && TRANSLATION_TARGET_OPTIONS.some((o) => o.code === raw)) return raw;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function setStoredTranslationTargetCode(code: string): void {
  try {
    localStorage.setItem(TRANSLATION_TARGET_STORAGE_KEY, code);
  } catch {
    /* ignore */
  }
}

export function optionByCode(code: string): TranslationTargetOption | undefined {
  return TRANSLATION_TARGET_OPTIONS.find((o) => o.code === code);
}
