import en from "@/src/i18n/locales/en.json";
import ar from "@/src/i18n/locales/ar.json";
import id from "@/src/i18n/locales/id.json";

export type I18nLocale = "en" | "ar" | "id";

export const RTL_LOCALES: I18nLocale[] = ["ar"];

export function isRtl(locale: I18nLocale): boolean {
  return RTL_LOCALES.includes(locale);
}

const messages: Record<I18nLocale, typeof en> = { en, ar, id };

export function getT(locale: I18nLocale = "en") {
  const m = messages[locale] ?? messages.en;
  return (key: string): string => {
    const parts = key.split(".");
    let val: unknown = m;
    for (const p of parts) {
      val = (val as Record<string, unknown>)?.[p];
    }
    return typeof val === "string" ? val : key;
  };
}

export function getLocaleFromBrowser(): I18nLocale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language?.slice(0, 2) ?? "en";
  if (lang === "ar") return "ar";
  if (lang === "id") return "id";
  return "en";
}
