/**
 * Alias for `POST /api/stripe/checkout` — same body: `{ amount, coinsAmount }`.
 * (Some guides call this route `/api/checkout`.)
 */
export { runtime, POST } from "@/src/app/api/stripe/checkout/route";
