import type { ContentLocale } from "./content-i18n";
import { getContentT } from "./content-i18n";
import { getRandomDonorName, getRandomPurchaserName } from "./random-names";

export type NotificationType =
  | "found_partner_location"
  | "next_after_chat"
  | "vip_stealth_camera"
  | "sent_gift"
  | "purchased_plan"
  | "activated_filter";

export { USERNAMES_BY_LOCALE } from "./names-data";

/** Worldwide cities for social proof (e.g. "[User] din Tokyo a trimis...") */
const CITIES = [
  "Tokyo", "New York", "London", "Paris", "Berlin", "București", "Warsaw", "Istanbul", "São Paulo", "Madrid",
  "Rome", "Amsterdam", "Vienna", "Prague", "Lisbon", "Athens", "Copenhagen", "Stockholm", "Oslo", "Helsinki",
  "Dublin", "Brussels", "Zurich", "Milan", "Barcelona", "Mexico City", "Buenos Aires", "Lima", "Bogotá", "Sydney",
];

const COUNTRIES: Record<ContentLocale, string[]> = {
  ro: ["România", "Germania", "Franța", "Italia", "Spania", "Polonia", "Olanda", "Portugalia", "Turcia", "UK", "Ungaria", "Cehia", "Suedia", "Austria"],
  en: ["Romania", "Germany", "France", "Italy", "Spain", "Poland", "Netherlands", "Portugal", "Turkey", "UK", "Hungary", "Czech Republic", "Sweden", "Austria"],
  de: ["Rumänien", "Frankreich", "Italien", "Spanien", "Polen", "Niederlande", "Portugal", "Türkei", "UK", "Ungarn", "Tschechien", "Schweden", "Österreich"],
  it: ["Romania", "Germania", "Francia", "Spagna", "Polonia", "Paesi Bassi", "Portogallo", "Turchia", "UK", "Ungheria", "Rep. Ceca", "Svezia", "Austria"],
  es: ["Rumanía", "Alemania", "Francia", "Italia", "Polonia", "Países Bajos", "Portugal", "Turquía", "Reino Unido", "Hungría", "Chequia", "Suecia", "Austria"],
  fr: ["Roumanie", "Allemagne", "Italie", "Espagne", "Pologne", "Pays-Bas", "Portugal", "Turquie", "Royaume-Uni", "Hongrie", "Rép. tchèque", "Suède", "Autriche"],
  pt: ["Roménia", "Alemanha", "França", "Itália", "Espanha", "Polónia", "Países Baixos", "Turquia", "Reino Unido", "Hungria", "Chéquia", "Suécia", "Áustria"],
  nl: ["Roemenië", "Duitsland", "Frankrijk", "Italië", "Spanje", "Polen", "Portugal", "Turkije", "VK", "Hongarije", "Tsjechië", "Zweden", "Oostenrijk"],
  pl: ["Rumunia", "Niemcy", "Francja", "Włochy", "Hiszpania", "Holandia", "Portugalia", "Turcja", "UK", "Węgry", "Czechy", "Szwecja", "Austria"],
  tr: ["Romanya", "Almanya", "Fransa", "İtalya", "İspanya", "Polonya", "Hollanda", "Portekiz", "İngiltere", "Macaristan", "Çekya", "İsveç", "Avusturya"],
};

export const TIME_LABELS: Record<ContentLocale, string[]> = {
  ro: ["Chiar acum", "Acum 45 secunde", "Acum 3 minute", "Recent", "Acum 1 minut", "Acum 2 minute"],
  en: ["Just now", "45 seconds ago", "3 minutes ago", "Recent", "1 minute ago", "2 minutes ago"],
  de: ["Gerade eben", "Vor 45 Sekunden", "Vor 3 Minuten", "Kürzlich", "Vor 1 Minute", "Vor 2 Minuten"],
  it: ["Proprio ora", "45 secondi fa", "3 minuti fa", "Recente", "1 minuto fa", "2 minuti fa"],
  es: ["Ahora mismo", "Hace 45 segundos", "Hace 3 minutos", "Reciente", "Hace 1 minuto", "Hace 2 minutos"],
  fr: ["À l'instant", "Il y a 45 secondes", "Il y a 3 minutes", "Récent", "Il y a 1 minute", "Il y a 2 minutes"],
  pt: ["Agora mesmo", "Há 45 segundos", "Há 3 minutos", "Recente", "Há 1 minuto", "Há 2 minutos"],
  nl: ["Zojuist", "45 seconden geleden", "3 minuten geleden", "Recent", "1 minuut geleden", "2 minuten geleden"],
  pl: ["Właśnie teraz", "45 sekund temu", "3 minuty temu", "Ostatnio", "1 minutę temu", "2 minuty temu"],
  tr: ["Şu an", "45 saniye önce", "3 dakika önce", "Son", "1 dakika önce", "2 dakika önce"],
};

type NotificationTemplate = (user: string, extra?: string) => string;

export const NOTIFICATION_TEMPLATES: Record<ContentLocale, Record<NotificationType, NotificationTemplate>> = {
  ro: {
    found_partner_location: (u, c) => `${u} tocmai a găsit un partener din ${c} folosind Filtrul de Locație.`,
    next_after_chat: (u) => `${u} a trecut la următorul partener după 15 minute de chat.`,
    vip_stealth_camera: (u) => `${u} a activat VIP Stealth Mode și a deblocat camera.`,
    sent_gift: (u, extra) => {
      const [g, city] = (extra || "").split("|");
      return city ? `${u} din ${city} a trimis un ${g}!` : `${u} a trimis un ${g}!`;
    },
    purchased_plan: (u, p) => `${u} tocmai a cumpărat ${p}.`,
    activated_filter: (u, msg) => `${u} ${msg}`,
  },
  en: {
    found_partner_location: (u, c) => `${u} just found a partner from ${c} using the Location filter.`,
    next_after_chat: (u) => `${u} moved to the next partner after 15 minutes of chat.`,
    vip_stealth_camera: (u) => `${u} activated VIP Stealth Mode and unlocked the camera.`,
    sent_gift: (u, extra) => {
      const [g, city] = (extra || "").split("|");
      return city ? `${u} from ${city} sent a ${g}!` : `${u} sent a ${g}!`;
    },
    purchased_plan: (u, p) => `${u} just purchased ${p}.`,
    activated_filter: (u, msg) => `${u} ${msg}`,
  },
  de: {
    found_partner_location: (u, c) => `${u} hat gerade einen Partner aus ${c} mit dem Standortfilter gefunden.`,
    next_after_chat: (u) => `${u} ist nach 15 Min. Chat zum nächsten Partner gewechselt.`,
    vip_stealth_camera: (u) => `${u} hat VIP Stealth Mode aktiviert und die Kamera freigeschaltet.`,
    sent_gift: (u, extra) => {
      const [g, city] = (extra || "").split("|");
      return city ? `${u} aus ${city} hat ein ${g} gesendet!` : `${u} hat ein ${g} gesendet!`;
    },
    purchased_plan: (u, p) => `${u} hat gerade ${p} gekauft.`,
    activated_filter: (u, msg) => `${u} ${msg}`,
  },
  it: {
    found_partner_location: (u, c) => `${u} ha appena trovato un partner da ${c} con il filtro Posizione.`,
    next_after_chat: (u) => `${u} è passato al partner successivo dopo 15 minuti di chat.`,
    vip_stealth_camera: (u) => `${u} ha attivato la Modalità Stealth VIP e sbloccato la camera.`,
    sent_gift: (u, extra) => {
      const [g, city] = (extra || "").split("|");
      return city ? `${u} da ${city} ha inviato un ${g}!` : `${u} ha inviato un ${g}!`;
    },
    purchased_plan: (u, p) => `${u} ha appena acquistato ${p}.`,
    activated_filter: (u, msg) => `${u} ${msg}`,
  },
  es: {
    found_partner_location: (u, c) => `${u} acaba de encontrar pareja en ${c} con el filtro de Ubicación.`,
    next_after_chat: (u) => `${u} pasó al siguiente partner tras 15 min de chat.`,
    vip_stealth_camera: (u) => `${u} activó el modo VIP Stealth y desbloqueó la cámara.`,
    sent_gift: (u, extra) => {
      const [g, city] = (extra || "").split("|");
      return city ? `${u} desde ${city} envió un ${g}!` : `${u} envió un ${g}!`;
    },
    purchased_plan: (u, p) => `${u} acaba de comprar ${p}.`,
    activated_filter: (u, msg) => `${u} ${msg}`,
  },
  fr: {
    found_partner_location: (u, c) => `${u} vient de trouver un partenaire en ${c} avec le filtre Lieu.`,
    next_after_chat: (u) => `${u} est passé au partenaire suivant après 15 min de chat.`,
    vip_stealth_camera: (u) => `${u} a activé le mode VIP Stealth et débloqué la caméra.`,
    sent_gift: (u, extra) => {
      const [g, city] = (extra || "").split("|");
      return city ? `${u} de ${city} a envoyé un ${g}!` : `${u} a envoyé un ${g}!`;
    },
    purchased_plan: (u, p) => `${u} vient d'acheter ${p}.`,
    activated_filter: (u, msg) => `${u} ${msg}`,
  },
  pt: {
    found_partner_location: (u, c) => `${u} acabou de encontrar parceiro em ${c} com o filtro de Localização.`,
    next_after_chat: (u) => `${u} passou ao próximo parceiro após 15 min de chat.`,
    vip_stealth_camera: (u) => `${u} ativou o modo VIP Stealth e desbloqueou a câmara.`,
    sent_gift: (u, extra) => {
      const [g, city] = (extra || "").split("|");
      return city ? `${u} de ${city} enviou um ${g}!` : `${u} enviou um ${g}!`;
    },
    purchased_plan: (u, p) => `${u} acabou de comprar ${p}.`,
    activated_filter: (u, msg) => `${u} ${msg}`,
  },
  nl: {
    found_partner_location: (u, c) => `${u} heeft net een partner uit ${c} gevonden met het Locatiefilter.`,
    next_after_chat: (u) => `${u} is na 15 min chat naar de volgende partner gegaan.`,
    vip_stealth_camera: (u) => `${u} heeft VIP Stealth Mode geactiveerd en de camera ontgrendeld.`,
    sent_gift: (u, extra) => {
      const [g, city] = (extra || "").split("|");
      return city ? `${u} uit ${city} heeft een ${g} gestuurd!` : `${u} heeft een ${g} gestuurd!`;
    },
    purchased_plan: (u, p) => `${u} heeft zojuist ${p} gekocht.`,
    activated_filter: (u, msg) => `${u} ${msg}`,
  },
  pl: {
    found_partner_location: (u, c) => `${u} właśnie znalazł partnera z ${c} używając filtra Lokalizacji.`,
    next_after_chat: (u) => `${u} przeszedł do następnego partnera po 15 min czatu.`,
    vip_stealth_camera: (u) => `${u} aktywował tryb VIP Stealth i odblokował kamerę.`,
    sent_gift: (u, extra) => {
      const [g, city] = (extra || "").split("|");
      return city ? `${u} z ${city} wysłał ${g}!` : `${u} wysłał ${g}!`;
    },
    purchased_plan: (u, p) => `${u} właśnie kupił ${p}.`,
    activated_filter: (u, msg) => `${u} ${msg}`,
  },
  tr: {
    found_partner_location: (u, c) => `${u} Konum filtresini kullanarak ${c}'den bir partner buldu.`,
    next_after_chat: (u) => `${u} 15 dk sohbetten sonra sonraki partnere geçti.`,
    vip_stealth_camera: (u) => `${u} VIP Gizli Modu etkinleştirdi ve kameranın kilidini açtı.`,
    sent_gift: (u, extra) => {
      const [g, city] = (extra || "").split("|");
      return city ? `${u} ${city}'den ${g} gönderdi!` : `${u} ${g} gönderdi!`;
    },
    purchased_plan: (u, p) => `${u} az önce ${p} satın aldı.`,
    activated_filter: (u, msg) => `${u} ${msg}`,
  },
};

/** Gift label with price for social proof, e.g. "Diamant (0.99$)" */
const GIFT_WITH_PRICE: Record<ContentLocale, string[]> = {
  ro: ["Like / Inimă (0.10$)", "Trandafir (0.25$)", "Cafea / Bere (0.50$)", "Diamant (0.99$)"],
  en: ["Like / Heart (0.10$)", "Rose (0.25$)", "Coffee / Beer (0.50$)", "Diamond (0.99$)"],
  de: ["Like / Herz (0.10$)", "Rose (0.25$)", "Kaffee / Bier (0.50$)", "Diamant (0.99$)"],
  it: ["Like / Cuore (0.10$)", "Rosa (0.25$)", "Caffè / Birra (0.50$)", "Diamante (0.99$)"],
  es: ["Like / Corazón (0.10$)", "Rosa (0.25$)", "Café / Cerveza (0.50$)", "Diamante (0.99$)"],
  fr: ["Like / Cœur (0.10$)", "Rose (0.25$)", "Café / Bière (0.50$)", "Diamant (0.99$)"],
  pt: ["Like / Coração (0.10$)", "Rosa (0.25$)", "Café / Cerveja (0.50$)", "Diamante (0.99$)"],
  nl: ["Like / Hart (0.10$)", "Roos (0.25$)", "Koffie / Bier (0.50$)", "Diamant (0.99$)"],
  pl: ["Like / Serce (0.10$)", "Róża (0.25$)", "Kawa / Piwo (0.50$)", "Diament (0.99$)"],
  tr: ["Like / Kalp (0.10$)", "Gül (0.25$)", "Kahve / Bira (0.50$)", "Elmas (0.99$)"],
};

/** Activation message for "activated filter" social proof (no country). */
const ACTIVATION_MESSAGES: Record<ContentLocale, string[]> = {
  ro: ["a activat Filtrul de Locație pentru doar 0.49$.", "a activat Filtrul Gen pentru doar 0.79$.", "a activat Full Pass pentru doar 1.99$."],
  en: ["activated Location Filter for just 0.49$.", "activated Gender Filter for just 0.79$.", "activated Full Pass for just 1.99$."],
  de: ["hat den Standortfilter für nur 0.49€ aktiviert.", "hat den Geschlechtsfilter für nur 0.79€ aktiviert.", "hat Full Pass für nur 1.99€ aktiviert."],
  it: ["ha attivato il Filtro Posizione per solo 0.49$.", "ha attivato il Filtro Genere per solo 0.79$.", "ha attivato Full Pass per solo 1.99$."],
  es: ["activó el Filtro Ubicación por solo 0.49$.", "activó el Filtro Género por solo 0.79$.", "activó Full Pass por solo 1.99$."],
  fr: ["a activé le Filtre Lieu pour seulement 0.49$.", "a activé le Filtre Genre pour seulement 0.79$.", "a activé Full Pass pour seulement 1.99$."],
  pt: ["ativou o Filtro Localização por apenas 0.49$.", "ativou o Filtro Género por apenas 0.79$.", "ativou Full Pass por apenas 1.99$."],
  nl: ["heeft Locatiefilter geactiveerd voor slechts 0.49$.", "heeft Geslachtsfilter geactiveerd voor slechts 0.79$.", "heeft Full Pass geactiveerd voor slechts 1.99$."],
  pl: ["aktywował filtr Lokalizacji za jedyne 0.49$.", "aktywował filtr Płci za jedyne 0.79$.", "aktywował Full Pass za jedyne 1.99$."],
  tr: ["Konum Filtresini sadece 0.49$'a etkinleştirdi.", "Cinsiyet Filtresini sadece 0.79$'a etkinleştirdi.", "Full Pass'i sadece 1.99$'a etkinleştirdi."],
};

/** "[User] din [City] tocmai a activat Filtrul Global." */
const ACTIVATION_FROM_CITY: Record<ContentLocale, (city: string) => string> = {
  ro: (c) => `din ${c} tocmai a activat Filtrul Global.`,
  en: (c) => `from ${c} just activated the Global Filter.`,
  de: (c) => `aus ${c} hat gerade den Globalfilter aktiviert.`,
  it: (c) => `da ${c} ha appena attivato il Filtro Globale.`,
  es: (c) => `desde ${c} acaba de activar el Filtro Global.`,
  fr: (c) => `de ${c} vient d'activer le Filtre Global.`,
  pt: (c) => `de ${c} ativou o Filtro Global.`,
  nl: (c) => `uit ${c} heeft zojuist het Globale filter geactiveerd.`,
  pl: (c) => `z ${c} właśnie aktywował Filtr Globalny.`,
  tr: (c) => `${c}'den Küresel Filtreyi etkinleştirdi.`,
};

const PLANS_FOR_NOTIFICATION: Record<ContentLocale, string[]> = {
  ro: ["Filtru Locație (0.49$)", "Filtru Gen (0.79$)", "Full Pass (1.99$)"],
  en: ["Location Filter (0.49$)", "Gender Filter (0.79$)", "Full Pass (1.99$)"],
  de: ["Standortfilter (0.49$)", "Geschlechtsfilter (0.79$)", "Full Pass (1.99$)"],
  it: ["Filtro Posizione (0.49$)", "Filtro Genere (0.79$)", "Full Pass (1.99$)"],
  es: ["Filtro Ubicación (0.49$)", "Filtro Género (0.79$)", "Full Pass (1.99$)"],
  fr: ["Filtre Lieu (0.49$)", "Filtre Genre (0.79$)", "Full Pass (1.99$)"],
  pt: ["Filtro Localização (0.49$)", "Filtro Género (0.79$)", "Full Pass (1.99$)"],
  nl: ["Locatiefilter (0.49$)", "Geslachtsfilter (0.79$)", "Full Pass (1.99$)"],
  pl: ["Filtr Lokalizacji (0.49$)", "Filtr Płci (0.79$)", "Full Pass (1.99$)"],
  tr: ["Konum Filtresi (0.49$)", "Cinsiyet Filtresi (0.79$)", "Full Pass (1.99$)"],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildNotification(
  locale: ContentLocale,
  type?: NotificationType
): { message: string; timeLabel: string } {
  const templates = NOTIFICATION_TEMPLATES[locale];
  const countries = COUNTRIES[locale];
  const timeLabels = TIME_LABELS[locale];

  const timeLabel = pick(timeLabels);

  const chosenType: NotificationType = type ?? pick([
    "found_partner_location",
    "next_after_chat",
    "vip_stealth_camera",
    "sent_gift",
    "purchased_plan",
    "activated_filter",
  ]);

  let message: string;
  switch (chosenType) {
    case "found_partner_location": {
      const user = getRandomPurchaserName(locale);
      message = templates.found_partner_location(user, pick(countries));
      break;
    }
    case "activated_filter": {
      const user = getRandomPurchaserName(locale);
      const msg = Math.random() < 0.5
        ? pick(ACTIVATION_MESSAGES[locale])
        : ACTIVATION_FROM_CITY[locale](pick(CITIES));
      message = templates.activated_filter(user, msg);
      break;
    }
    case "sent_gift": {
      if (Math.random() < 0.35) {
        message = getContentT(locale).someoneSentGift;
      } else {
        const user = getRandomDonorName(locale);
        const gift = pick(GIFT_WITH_PRICE[locale]);
        const withCity = Math.random() < 0.5 ? `|${pick(CITIES)}` : "";
        message = templates.sent_gift(user, gift + withCity);
      }
      break;
    }
    case "purchased_plan": {
      const user = getRandomPurchaserName(locale);
      message = templates.purchased_plan(user, pick(PLANS_FOR_NOTIFICATION[locale]));
      break;
    }
    case "next_after_chat":
    case "vip_stealth_camera": {
      const user = getRandomPurchaserName(locale);
      message = templates[chosenType](user);
      break;
    }
  }

  return { message, timeLabel };
}
