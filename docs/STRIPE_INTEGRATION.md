# Stripe integration — neonchat.live

End-to-end flow: **authenticated user** buys coins → **Checkout Session** → **Stripe-hosted payment** → **`checkout.session.completed` webhook** → **Prisma `User.coins` increment** (+ wallet ledger).

## 1. Environment (`.env` / Railway)

| Variable | Role |
|----------|------|
| `STRIPE_SECRET_KEY` | Server SDK (`sk_live_…` / `sk_test_…`). Loaded in `lib/stripe.ts`. |
| `STRIPE_WEBHOOK_SECRET` | Verifies webhook signatures (`whsec_…`). Required for production webhooks. |

Optional: `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` for client-side Stripe.js; Checkout redirect flow does not require it.

See also `.env.example` and `README_STRIPE.md`.

## 2. Checkout — `POST /api/stripe/checkout`

- **Auth:** NextAuth session; `userId` from JWT/session.
- **Body:** `{ "amount": number, "coinsAmount": number }` — must match a known billing pack (`src/lib/billing-packs.ts`).
- **Session:**
  - `mode: "payment"`, `currency` via line item (`usd`).
  - **`payment_intent_data.automatic_payment_methods.enabled: true`** — Stripe picks methods from your [Dashboard payment methods](https://dashboard.stripe.com/settings/payment_methods).
  - **Metadata:** `userId`, `coinsAmount`, **`coinAmount`** (coins credited), `coinsToBuy`, `checkout_kind: "billing_pack"`, `packId`, `amount_cents` — used to validate the webhook and prevent tampering.
  - **Tax / address:** `stripeCheckoutComplianceParams()` (Stripe Tax + billing address) unless `STRIPE_AUTOMATIC_TAX=false`.
- **Response:** `{ "url": "https://checkout.stripe.com/..." }` — redirect the browser there.

Implementation: `src/app/api/stripe/checkout/route.ts` (re-exported from `app/api/stripe/checkout/route.ts`).

## 3. Webhook — `POST /api/webhook/stripe`

1. Read **raw body** as text (required for signature verification).
2. Read header **`Stripe-Signature`**.
3. **`stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)`** — rejects forged requests (returns 400 if invalid).
4. On **`checkout.session.completed`**, call `handleCheckoutSessionCompleted(session)` in `src/lib/stripe-webhook-handler.ts`.

Legacy alias: **`POST /api/webhooks/stripe`** (same handler).

**Stripe Dashboard:** endpoint URL  
`https://www.neonchat.live/api/webhook/stripe`  
(or `/api/webhooks/stripe` if you prefer that path).  
Subscribe at minimum to **`checkout.session.completed`**.

## 4. Database / idempotency

- **`StripePurchase`** row is inserted first with unique `stripeSessionId` (Prisma `P2002` → duplicate event = no-op).
- For **`billing_pack`**, fulfillment:
  - Validates metadata vs. pack (`packId`, `amount_cents`, `coinsAmount` / **`coinAmount`** / `coinsToBuy`) and `session.amount_total`.
  - **`addCoins`** (Supabase wallet) + **`prisma.user.update({ coins: { increment } })`** + **`WalletCreditTransaction`** audit row.
- Plan checkouts (other metadata shape) follow `fulfillPlanCheckout`.

## 5. Security checklist

- [ ] Never expose `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` to the client.
- [ ] Only trust **`constructEvent`**-verified payloads; ignore JSON bodies without a valid signature.
- [ ] Rely on **server-side pack validation** in the webhook (amount + metadata), not client-supplied amounts alone.
- [ ] Use **HTTPS** for the webhook URL in production.

## 6. File map

| Piece | Path |
|-------|------|
| Secret key + Stripe client | `lib/stripe.ts` |
| Env key names (reference) | `src/config/stripe-env.ts` |
| Checkout session helpers | `src/lib/stripe-checkout-shared.ts` |
| Coins checkout route | `src/app/api/stripe/checkout/route.ts` |
| Plan checkout route | `src/app/api/stripe/create-checkout-session/route.ts` + `src/lib/stripe-service.ts` |
| Webhook HTTP + signature | `src/lib/stripe-webhook-http.ts` |
| Webhook business logic | `src/lib/stripe-webhook-handler.ts` |
| Route exports | `app/api/webhook/stripe/route.ts`, `app/api/webhooks/stripe/route.ts` |
