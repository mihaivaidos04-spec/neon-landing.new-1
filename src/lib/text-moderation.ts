/**
 * Text moderation: mask banned words, phone numbers, external links.
 * Uses bad-words for profanity. Keeps neon.com links allowed.
 */

import { Filter } from "bad-words";

const PHONE_PATTERN = /(?:\+\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}(?:[-.\s]?\d{2,4})?|\d{10,}/g;
const URL_REGEX = /https?:\/\/[^\s]+/gi;
const ALLOWED_DOMAINS = ["neon.com", "www.neon.com", "neon.app", "www.neon.app"];

const filter = new Filter({ placeHolder: "*" });

function isAllowedUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return ALLOWED_DOMAINS.some((d) => host === d.replace(/^www\./, "") || host.endsWith("." + d));
  } catch {
    return false;
  }
}

function maskPhoneNumbers(text: string): string {
  return text.replace(new RegExp(PHONE_PATTERN.source, "g"), (match) =>
    "*".repeat(Math.min(match.length, 8))
  );
}

function maskExternalLinks(text: string): string {
  return text.replace(URL_REGEX, (match) => {
    if (isAllowedUrl(match)) return match;
    return "*".repeat(Math.min(match.length, 12));
  });
}

export type ModerationResult = {
  filtered: string;
  wasModified: boolean;
  hadBannedWords: boolean;
  hadPhone: boolean;
  hadExternalLink: boolean;
};

/**
 * Filter text: mask banned words, phone numbers, external links (except neon.com).
 */
export function moderateText(text: string): ModerationResult {
  if (!text || typeof text !== "string") {
    return { filtered: "", wasModified: false, hadBannedWords: false, hadPhone: false, hadExternalLink: false };
  }

  try {
    let filtered = text;
    let hadBannedWords = false;
    let hadPhone = false;
    let hadExternalLink = false;

    const beforeBadWords = filtered;
    /** `bad-words` can throw on some Unicode / split edge cases (e.g. Turkish ı, mixed emoji). */
    try {
      const cleaned = filter.clean(filtered);
      filtered = typeof cleaned === "string" ? cleaned : filtered;
    } catch {
      filtered = text;
    }
    if (filtered !== beforeBadWords) hadBannedWords = true;

    if (new RegExp(PHONE_PATTERN.source).test(filtered)) {
      hadPhone = true;
      filtered = maskPhoneNumbers(filtered);
    }

    const urlMatches = filtered.match(URL_REGEX);
    if (urlMatches) {
      const hasExternal = urlMatches.some((u) => !isAllowedUrl(u));
      if (hasExternal) {
        hadExternalLink = true;
        filtered = maskExternalLinks(filtered);
      }
    }

    const wasModified = hadBannedWords || hadPhone || hadExternalLink;
    return { filtered, wasModified, hadBannedWords, hadPhone, hadExternalLink };
  } catch {
    return {
      filtered: text,
      wasModified: false,
      hadBannedWords: false,
      hadPhone: false,
      hadExternalLink: false,
    };
  }
}

/**
 * Check if a message should be considered spam (for consecutive spam tracking).
 * Messages with banned content, phone numbers, or external links count as spam.
 */
export function isSpamLike(result: ModerationResult): boolean {
  return result.wasModified;
}

/**
 * Sanitize for display (e.g. usernames, bios). Returns filtered string.
 */
export function sanitizeForDisplay(text: string): string {
  return moderateText(text).filtered;
}
