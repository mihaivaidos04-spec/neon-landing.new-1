/**
 * Live Ticker – anonymized event messages for the scrolling ticker.
 * Format: "Utilizator72 a trimis un Cadou Premium!" / "Cineva tocmai a activat Priority Match!"
 * Folosește randomizer pentru donatori și cumpărători.
 */

import type { ContentLocale } from "./content-i18n";
import { getRandomDonorName, getRandomPurchaserName } from "./random-names";
import { pickRandomDemoCountry } from "./demo-country-pool";

export type TickerItem = {
  text: string;
  /** Country for donor-style events (gift-related); generic events may omit */
  countryCode: string | null;
};

export type TickerEventType =
  | "premium_gift"
  | "priority_match"
  | "gender_filter"
  | "full_pass"
  | "diamond_gift"
  | "mystery_box"
  | "battery_recharge";

type TickerTemplate = (user: string) => string;

const TICKER_TEMPLATES: Record<ContentLocale, Record<TickerEventType, TickerTemplate>> = {
  ro: {
    premium_gift: (u) => `${u} a trimis un Cadou Premium!`,
    priority_match: () => `Cineva tocmai a activat Priority Match!`,
    gender_filter: (u) => `${u} a activat Filtrul de Gen.`,
    full_pass: (u) => `${u} tocmai a cumpărat Full Pass!`,
    diamond_gift: (u) => `${u} a trimis un Diamant!`,
    mystery_box: (u) => `${u} a deschis Mystery Box!`,
    battery_recharge: (u) => `${u} a reîncărcat bateria.`,
  },
  en: {
    premium_gift: (u) => `${u} sent a Premium Gift!`,
    priority_match: () => `Someone just activated Priority Match!`,
    gender_filter: (u) => `${u} activated Gender Filter.`,
    full_pass: (u) => `${u} just purchased Full Pass!`,
    diamond_gift: (u) => `${u} sent a Diamond!`,
    mystery_box: (u) => `${u} opened Mystery Box!`,
    battery_recharge: (u) => `${u} recharged their battery.`,
  },
  de: {
    premium_gift: (u) => `${u} hat ein Premium-Geschenk gesendet!`,
    priority_match: () => `Jemand hat gerade Priority Match aktiviert!`,
    gender_filter: (u) => `${u} hat den Geschlechtsfilter aktiviert.`,
    full_pass: (u) => `${u} hat gerade Full Pass gekauft!`,
    diamond_gift: (u) => `${u} hat einen Diamanten gesendet!`,
    mystery_box: (u) => `${u} hat Mystery Box geöffnet!`,
    battery_recharge: (u) => `${u} hat den Akku aufgeladen.`,
  },
  it: {
    premium_gift: (u) => `${u} ha inviato un Regalo Premium!`,
    priority_match: () => `Qualcuno ha appena attivato Priority Match!`,
    gender_filter: (u) => `${u} ha attivato il Filtro Genere.`,
    full_pass: (u) => `${u} ha appena acquistato Full Pass!`,
    diamond_gift: (u) => `${u} ha inviato un Diamante!`,
    mystery_box: (u) => `${u} ha aperto Mystery Box!`,
    battery_recharge: (u) => `${u} ha ricaricato la batteria.`,
  },
  es: {
    premium_gift: (u) => `${u} envió un Regalo Premium!`,
    priority_match: () => `¡Alguien acaba de activar Priority Match!`,
    gender_filter: (u) => `${u} activó el Filtro Género.`,
    full_pass: (u) => `${u} acaba de comprar Full Pass!`,
    diamond_gift: (u) => `${u} envió un Diamante!`,
    mystery_box: (u) => `${u} abrió Mystery Box!`,
    battery_recharge: (u) => `${u} recargó la batería.`,
  },
  fr: {
    premium_gift: (u) => `${u} a envoyé un Cadeau Premium!`,
    priority_match: () => `Quelqu'un vient d'activer Priority Match!`,
    gender_filter: (u) => `${u} a activé le Filtre Genre.`,
    full_pass: (u) => `${u} vient d'acheter Full Pass!`,
    diamond_gift: (u) => `${u} a envoyé un Diamant!`,
    mystery_box: (u) => `${u} a ouvert Mystery Box!`,
    battery_recharge: (u) => `${u} a rechargé la batterie.`,
  },
  pt: {
    premium_gift: (u) => `${u} enviou um Presente Premium!`,
    priority_match: () => `Alguém acabou de ativar Priority Match!`,
    gender_filter: (u) => `${u} ativou o Filtro Género.`,
    full_pass: (u) => `${u} acabou de comprar Full Pass!`,
    diamond_gift: (u) => `${u} enviou um Diamante!`,
    mystery_box: (u) => `${u} abriu Mystery Box!`,
    battery_recharge: (u) => `${u} recarregou a bateria.`,
  },
  nl: {
    premium_gift: (u) => `${u} heeft een Premium Cadeau gestuurd!`,
    priority_match: () => `Iemand heeft net Priority Match geactiveerd!`,
    gender_filter: (u) => `${u} heeft Geslachtsfilter geactiveerd.`,
    full_pass: (u) => `${u} heeft net Full Pass gekocht!`,
    diamond_gift: (u) => `${u} heeft een Diamant gestuurd!`,
    mystery_box: (u) => `${u} heeft Mystery Box geopend!`,
    battery_recharge: (u) => `${u} heeft de batterij opgeladen.`,
  },
  pl: {
    premium_gift: (u) => `${u} wysłał Prezent Premium!`,
    priority_match: () => `Ktoś właśnie aktywował Priority Match!`,
    gender_filter: (u) => `${u} aktywował filtr Płci.`,
    full_pass: (u) => `${u} właśnie kupił Full Pass!`,
    diamond_gift: (u) => `${u} wysłał Diament!`,
    mystery_box: (u) => `${u} otworzył Mystery Box!`,
    battery_recharge: (u) => `${u} naładował baterię.`,
  },
  tr: {
    premium_gift: (u) => `${u} Premium Hediye gönderdi!`,
    priority_match: () => `Biri az önce Priority Match etkinleştirdi!`,
    gender_filter: (u) => `${u} Cinsiyet Filtresini etkinleştirdi.`,
    full_pass: (u) => `${u} az önce Full Pass satın aldı!`,
    diamond_gift: (u) => `${u} Elmas gönderdi!`,
    mystery_box: (u) => `${u} Mystery Box açtı!`,
    battery_recharge: (u) => `${u} pili şarj etti.`,
  },
};

const EVENT_TYPES: TickerEventType[] = [
  "premium_gift",
  "priority_match",
  "gender_filter",
  "full_pass",
  "diamond_gift",
  "mystery_box",
  "battery_recharge",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Evenimente de tip donator (trimite cadou) vs cumpărător (achiziționează) */
const DONOR_EVENTS: TickerEventType[] = [
  "premium_gift",
  "diamond_gift",
];

export function buildTickerEvent(
  locale: ContentLocale,
  type?: TickerEventType
): TickerItem {
  const templates = TICKER_TEMPLATES[locale];
  const eventType = type ?? pick(EVENT_TYPES);
  const template = templates[eventType];
  const user = DONOR_EVENTS.includes(eventType)
    ? getRandomDonorName(locale)
    : getRandomPurchaserName(locale);
  const isDonorStyle = DONOR_EVENTS.includes(eventType);
  return {
    text: template(user),
    countryCode: isDonorStyle ? pickRandomDemoCountry() : null,
  };
}
