import type { ContentLocale } from "./content-i18n";
import { pickLocalizedUsername } from "./chat-usernames-by-country";
import { DEMO_COUNTRY_POOL, ORDERED_DEMO_COUNTRIES } from "./demo-country-pool";

/** Used when imports are not ready yet (client chunk / HMR) — must never be empty. */
const FALLBACK_ISO2_ORDERED: string[] = [
  "AE", "AL", "AM", "AR", "AT", "AU", "AZ", "BA", "BD", "BE", "BG", "BH", "BN", "BR", "BW", "BY", "CA", "CH", "CL",
  "CN", "CO", "CR", "CY", "CZ", "DE", "DJ", "DK", "DZ", "EC", "EE", "EG", "ES", "ET", "FI", "FJ", "FR", "GB", "GE",
  "GH", "GR", "HK", "HR", "HU", "ID", "IE", "IL", "IN", "IQ", "IS", "IT", "JO", "JP", "KE", "KH", "KR", "KW", "KZ",
  "LA", "LB", "LK", "LT", "LU", "LV", "LY", "MA", "MK", "ML", "MM", "MN", "MT", "MU", "MX", "MY", "NA", "NE", "NG",
  "NL", "NO", "NP", "NZ", "OM", "PE", "PH", "PK", "PL", "PS", "PT", "PY", "QA", "RO", "RS", "RU", "SA", "SE", "SG",
  "SI", "SK", "SO", "SY", "TD", "TH", "TN", "TR", "TW", "TZ", "UA", "UG", "US", "UY", "UZ", "VN", "YE", "ZA", "ZW",
];

export type ChatMessageEntry = { text: string };

export const CHAT_MESSAGES_BY_LOCALE: Record<ContentLocale, ChatMessageEntry[]> = {
  ro: [
    { text: "Hey, c f?" },
    { text: "u de unde esti?" },
    { text: "misto vibe-ul 🔥" },
    { text: "ce faci" },
    { text: "super tare ⚡" },
    { text: "haha ok" },
    { text: "nu stau mult dar hey" },
    { text: "imi place 🍺" },
    { text: "de unde?" },
    { text: "cool cool" },
    { text: "wow 🤠" },
    { text: "buna" },
    { text: "ce mai zici" },
    { text: "vibe bun" },
    { text: "ok next" },
    { text: "haha" },
    { text: "da" },
    { text: "nu prea" },
    { text: "fain" },
    { text: "lasa" },
  ],
  en: [
    { text: "hey wru from?" },
    { text: "wassup 🔥" },
    { text: "cool vibe ⚡" },
    { text: "lol" },
    { text: "nice one 🍺" },
    { text: "where u at" },
    { text: "not staying long but hi" },
    { text: "wow 🤠" },
    { text: "sup" },
    { text: "ok ok" },
    { text: "love it" },
    { text: "hey" },
    { text: "what u say" },
    { text: "good vibes" },
    { text: "next" },
    { text: "haha" },
    { text: "ye" },
    { text: "nah" },
    { text: "sick" },
    { text: "cya" },
  ],
  de: [
    { text: "hey woher?" },
    { text: "geiler vibe 🔥" },
    { text: "lol" },
    { text: "nice 🍺" },
    { text: "wo bist du" },
    { text: "bleib nicht lang aber hi" },
    { text: "wow 🤠" },
    { text: "was geht" },
    { text: "ok ok ⚡" },
    { text: "mag ich" },
    { text: "hey" },
    { text: "was sagst du" },
    { text: "gute vibes" },
    { text: "next" },
    { text: "haha" },
    { text: "ja" },
    { text: "nö" },
    { text: "geil" },
    { text: "tschau" },
  ],
  it: [
    { text: "hey da dove?" },
    { text: "vibe top 🔥" },
    { text: "lol" },
    { text: "bella 🍺" },
    { text: "dove sei" },
    { text: "non resto tanto ma ciao" },
    { text: "wow 🤠" },
    { text: "come va" },
    { text: "ok ok ⚡" },
    { text: "mi piace" },
    { text: "hey" },
    { text: "che dici" },
    { text: "vibes buone" },
    { text: "next" },
    { text: "ahah" },
    { text: "sì" },
    { text: "no" },
    { text: "figo" },
    { text: "ciao" },
  ],
  es: [
    { text: "hey d dnde?" },
    { text: "buen rollo 🔥" },
    { text: "jaja" },
    { text: "guay 🍺" },
    { text: "dnde ests" },
    { text: "no me quedo mucho pero hola" },
    { text: "wow 🤠" },
    { text: "q tal" },
    { text: "vale vale ⚡" },
    { text: "mola" },
    { text: "hey" },
    { text: "q dices" },
    { text: "buenas vibras" },
    { text: "siguiente" },
    { text: "jaja" },
    { text: "sí" },
    { text: "nah" },
    { text: "guay" },
    { text: "nos vemos" },
  ],
  fr: [
    { text: "hey t es d ou?" },
    { text: "bon vibe 🔥" },
    { text: "mdr" },
    { text: "cool 🍺" },
    { text: "t es où" },
    { text: "reste pas long mais salut" },
    { text: "wow 🤠" },
    { text: "quoi de neuf" },
    { text: "ok ok ⚡" },
    { text: "j aime" },
    { text: "hey" },
    { text: "tu en penses quoi" },
    { text: "bonnes vibes" },
    { text: "next" },
    { text: "mdr" },
    { text: "ouais" },
    { text: "nan" },
    { text: "top" },
    { text: "a+" },
  ],
  pt: [
    { text: "hey d onde?" },
    { text: "bom vibe 🔥" },
    { text: "ahah" },
    { text: "fixe 🍺" },
    { text: "onde estás" },
    { text: "não fico mt mas oi" },
    { text: "wow 🤠" },
    { text: "tudo bem" },
    { text: "ok ok ⚡" },
    { text: "gosto" },
    { text: "hey" },
    { text: "q dizes" },
    { text: "boas vibes" },
    { text: "próximo" },
    { text: "ahah" },
    { text: "sim" },
    { text: "não" },
    { text: "fixe" },
    { text: "até" },
  ],
  nl: [
    { text: "hey waar vandaan?" },
    { text: "goede vibe 🔥" },
    { text: "lol" },
    { text: "leuk 🍺" },
    { text: "waar ben je" },
    { text: "blijf niet lang maar hoi" },
    { text: "wow 🤠" },
    { text: "hoe gaat het" },
    { text: "ok ok ⚡" },
    { text: "mooi" },
    { text: "hey" },
    { text: "wat zeg je" },
    { text: "goede vibes" },
    { text: "volgende" },
    { text: "haha" },
    { text: "ja" },
    { text: "nee" },
    { text: "gaaf" },
    { text: "doei" },
  ],
  pl: [
    { text: "hej skąd?" },
    { text: "fajny vibe 🔥" },
    { text: "lol" },
    { text: "spoko 🍺" },
    { text: "gdzie jesteś" },
    { text: "nie zostaję długo ale cze" },
    { text: "wow 🤠" },
    { text: "co tam" },
    { text: "ok ok ⚡" },
    { text: "podoba mi się" },
    { text: "hej" },
    { text: "co mówisz" },
    { text: "dobre vibes" },
    { text: "następny" },
    { text: "haha" },
    { text: "tak" },
    { text: "nie" },
    { text: "fajnie" },
    { text: "pa" },
  ],
  tr: [
    { text: "selam nerelisin?" },
    { text: "iyi vibe 🔥" },
    { text: "lol" },
    { text: "süper 🍺" },
    { text: "neredesin" },
    { text: "uzun kalmıyorum ama selam" },
    { text: "vay 🤠" },
    { text: "naber" },
    { text: "tmm tmm ⚡" },
    { text: "beğendim" },
    { text: "selam" },
    { text: "ne diyorsun" },
    { text: "iyi vibes" },
    { text: "sonraki" },
    { text: "haha" },
    { text: "evet" },
    { text: "hayır" },
    { text: "süper" },
    { text: "görüşürüz" },
  ],
};

/** Extra lines so the 1000-step cycle rarely feels repetitive. */
const CROSS_LOCALE_CHAT_LINES: string[] = [
  "gm ☀️",
  "gn 🌙",
  "vc on?",
  "mic ok?",
  "cam laggy rn",
  "smooth ngl",
  "this filter hits different",
  "neon glow is sick",
  "any1 still up?",
  "brb 1m",
  "back",
  "that match was funny",
  "gift sent ty",
  "ty for the rose",
  "lol same",
  "where u calling from roughly?",
  "timezone check 😅",
  "music in bg?",
  "headphones only",
  "respect the vibe",
  "no weird stuff pls",
  "just chilling",
  "first time here",
  "regular here lol",
  "queue slow today",
  "fast matches tonight",
  "private?",
  "stay public for now",
  "icebreaker worth it",
  "saved my convo",
  "battery low rip",
  "need coins ngl",
  "filter worth",
  "ghost mode lowkey",
  "beauty blur funny",
  "undo saved me",
  "wrong skip 💀",
  "all good",
  "speak english ok?",
  "i use translate",
  "haha ok ok",
  "respect++",
  "wholesome chat",
  "wild but fun",
  "next when?",
  "one more",
  "last one promise",
  "ok cya",
  "hf everyone",
  "wave 👋",
  "o7",
  "GG",
  "nice pfp energy",
  "vibe check passed",
  "coffee first ☕",
  "night owl crew",
  "morning crew",
  "weekend mode",
  "after work mood",
  "study break",
  "work break lol",
  "dont ask for ig",
  "keep it here",
  "mods doing bits",
  "chat clean today",
  "global pulse is fun",
  "random is the point",
  "unexpected friend",
  "short stay hi",
  "long session ngl",
  "lag spike",
  "clear now",
  "audio echo?",
  "fixed",
  "👍",
  "🔥🔥",
  "⚡⚡",
  "lol ok",
  "real talk tho",
  "wholesome",
  "toxic free zone",
  "appreciate u",
  "ty neon",
];

function resolveLocaleKey(locale: string): ContentLocale {
  if (locale in CHAT_MESSAGES_BY_LOCALE) return locale as ContentLocale;
  return "en";
}

function getOrderedCountries(): string[] {
  try {
    if (ORDERED_DEMO_COUNTRIES != null && Array.isArray(ORDERED_DEMO_COUNTRIES) && ORDERED_DEMO_COUNTRIES.length > 0) {
      return ORDERED_DEMO_COUNTRIES;
    }
    if (DEMO_COUNTRY_POOL != null && Array.isArray(DEMO_COUNTRY_POOL) && DEMO_COUNTRY_POOL.length > 0) {
      return [...DEMO_COUNTRY_POOL].sort();
    }
  } catch {
    /* ignore */
  }
  return FALLBACK_ISO2_ORDERED;
}

function getAllMessageTextsForLocale(locale: string): string[] {
  const key = resolveLocaleKey(locale);
  const base = CHAT_MESSAGES_BY_LOCALE[key] ?? CHAT_MESSAGES_BY_LOCALE.en;
  const rows = Array.isArray(base) ? base : CHAT_MESSAGES_BY_LOCALE.en;
  const fromLocale = rows.map((m) => m.text).filter(Boolean);
  const cross = Array.isArray(CROSS_LOCALE_CHAT_LINES) ? CROSS_LOCALE_CHAT_LINES : [];
  const merged = [...fromLocale, ...cross];
  return merged.length > 0 ? merged : ["hey"];
}

/** Deterministic fake chat: full pattern repeats every N messages. */
export const FAKE_CHAT_CYCLE_LENGTH = 1000;

export function getFakeMessageForCycleIndex(
  cycleIndex: number,
  locale: ContentLocale | string,
  uniqueId: string | number
): ChatMessage {
  try {
    const i =
      ((cycleIndex % FAKE_CHAT_CYCLE_LENGTH) + FAKE_CHAT_CYCLE_LENGTH) % FAKE_CHAT_CYCLE_LENGTH;
    const countries = getOrderedCountries();
    if (!Array.isArray(countries) || countries.length === 0) {
      throw new Error("no countries");
    }
    const countryCode = String(countries[i % countries.length] ?? "US").slice(0, 2).toUpperCase() || "US";
    const user = pickLocalizedUsername(countryCode, i);
    const texts = getAllMessageTextsForLocale(String(locale ?? "en"));
    const len = Array.isArray(texts) && texts.length > 0 ? texts.length : 1;
    const textIndex = (i * 31 + (i >> 1) + (i % 7) * 13) % len;
    const text = (Array.isArray(texts) ? texts[textIndex] : null) ?? "hey";
    return {
      id: `sim-${uniqueId}`,
      user,
      text,
      countryCode,
    };
  } catch {
    return {
      id: `sim-${uniqueId}`,
      user: "guest",
      text: "hey",
      countryCode: "US",
    };
  }
}

export type ChatMessage = {
  id: string;
  user: string;
  text: string;
  /** ISO country for flag next to username */
  countryCode?: string | null;
  isDonor?: boolean;
  /** System message (no user name, neutral style) */
  isSystem?: boolean;
  /** Optional action link label e.g. "Reactivează" */
  actionLabel?: string;
};

export function generateFakeMessage(locale: ContentLocale): ChatMessage {
  return getFakeMessageForCycleIndex(
    Math.floor(Math.random() * FAKE_CHAT_CYCLE_LENGTH),
    locale,
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );
}
