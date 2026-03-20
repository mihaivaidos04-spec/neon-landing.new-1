/** Pool for simulated peers / ticker / chat (diverse ISO 3166-1 alpha-2). */
export const DEMO_COUNTRY_POOL: string[] = [
  "US", "GB", "DE", "FR", "IT", "ES", "RO", "BR", "JP", "IN", "AU", "CA", "NL", "PL", "PT", "TR",
  "SA", "EG", "MX", "KR", "SE", "NO", "GR", "CZ", "HU", "BG", "AR", "CO", "NG", "KE", "ZA", "TH",
  "VN", "PH", "MY", "ID", "AE", "NZ", "IE", "CH", "AT", "BE", "FI", "DK", "SK", "SI", "HR", "LT",
  "LV", "EE", "UA", "MD", "RS", "BA", "AL", "MK", "IS", "LU", "MT", "CY", "SG", "HK", "TW", "KH",
  "PE", "CL", "EC", "CR", "UY", "BO", "PY", "MA", "DZ", "TN", "GH", "PK", "BD", "LK", "NP", "IL",
  "JO", "LB", "KW", "QA", "BH", "OM", "IQ", "KZ", "UZ", "GE", "AM", "AZ", "BY", "RU", "CN", "MM",
  "LA", "ET", "TZ", "UG", "ZW", "BW", "NA", "MU", "FJ", "BN",
];

/** Stable order for deterministic fake chat cycles (matches flag country). */
export const ORDERED_DEMO_COUNTRIES: string[] = [...DEMO_COUNTRY_POOL].sort();

export function pickRandomDemoCountry(): string {
  return DEMO_COUNTRY_POOL[Math.floor(Math.random() * DEMO_COUNTRY_POOL.length)]!;
}
