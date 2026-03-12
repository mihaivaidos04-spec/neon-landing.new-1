/**
 * Randomizer pentru nume la donatori și cumpărători.
 * Combină mai multe surse pentru varietate maximă.
 */

import type { ContentLocale } from "./content-i18n";
import { USERNAMES_BY_LOCALE } from "./names-data";
import { generateRandomUsername } from "./chat-usernames";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Prefixe pentru format "Utilizator72" (anonymized) */
const ANONYMIZED_PREFIXES: Record<ContentLocale, string> = {
  ro: "Utilizator",
  en: "User",
  de: "Nutzer",
  it: "Utente",
  es: "Usuario",
  fr: "Utilisateur",
  pt: "Utilizador",
  nl: "Gebruiker",
  pl: "Użytkownik",
  tr: "Kullanıcı",
};

function anonymizedName(locale: ContentLocale): string {
  const num = 10 + Math.floor(Math.random() * 990);
  return `${ANONYMIZED_PREFIXES[locale]}${num}`;
}

/**
 * Returnează un nume aleatoriu pentru donatori (cei care trimit cadouri).
 * 50% din USERNAMES_BY_LOCALE, 30% generateRandomUsername, 20% anonymized.
 */
export function getRandomDonorName(locale: ContentLocale): string {
  const r = Math.random();
  if (r < 0.5) {
    return pick(USERNAMES_BY_LOCALE[locale]);
  }
  if (r < 0.8) {
    return generateRandomUsername(locale);
  }
  return anonymizedName(locale);
}

/**
 * Returnează un nume aleatoriu pentru cumpărători (cei care achiziționează planuri/cadouri).
 * 50% din USERNAMES_BY_LOCALE, 30% generateRandomUsername, 20% anonymized.
 */
export function getRandomPurchaserName(locale: ContentLocale): string {
  const r = Math.random();
  if (r < 0.5) {
    return pick(USERNAMES_BY_LOCALE[locale]);
  }
  if (r < 0.8) {
    return generateRandomUsername(locale);
  }
  return anonymizedName(locale);
}
