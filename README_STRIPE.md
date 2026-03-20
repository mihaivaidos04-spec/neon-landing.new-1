# Stripe setup (NeonLive)

Payments use [Stripe Checkout](https://stripe.com/docs/payments/checkout) with the official Node SDK. Webhooks grant **platform credits** and optional **Privacy Plus** when `checkout.session.completed` fires.

## Environment variables

Add these to `.env` / `.env.local` (never commit secrets):

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | **Yes** | Secret key from [Stripe Dashboard → API keys](https://dashboard.stripe.com/apikeys) (`sk_live_...` or `sk_test_...`). |
| `STRIPE_WEBHOOK_SECRET` | **Yes (production)** | Signing secret for your webhook endpoint (`whsec_...`). |
| `NEXT_PUBLIC_APP_URL` or `NEXT_PUBLIC_SITE_URL` | Recommended | Public site origin **without** trailing slash, e.g. `https://neonlive.chat`. Used for Stripe success/cancel URLs. |
| `AUTH_URL` | If needed | Same idea as app URL for auth/callback consistency. |

Optional: keep existing DB/Supabase and auth variables as already documented for the app.

## Webhook endpoint

1. In Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
2. **URL:** `https://YOUR_DOMAIN/api/webhooks/stripe`
3. **Events:** at minimum `checkout.session.completed`.
4. Copy the **Signing secret** into `STRIPE_WEBHOOK_SECRET`.

### Local development

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use the `whsec_...` value the CLI prints as `STRIPE_WEBHOOK_SECRET` while testing.

## Products and prices

Checkout sessions are created with **inline `price_data`** (see `src/lib/stripe-service.ts` and `src/lib/stripe-products.ts`). You do **not** have to pre-create Stripe Products in the Dashboard for the default flow; you can switch to Dashboard Price IDs later if you prefer.

## Database

After pulling schema changes, apply to your database:

```bash
npx prisma migrate dev
# or
npx prisma db push
```

The `User` model includes optional `stripeCustomerId` and `stripeSubscriptionId` for future subscription features; one-time credit purchases still use Checkout.

## Legal pages (Stripe / card networks)

These routes are intended for compliance review:

- `/terms` — Terms of Service  
- `/privacy` — Privacy Policy  
- `/refunds` — Refunds & digital purchases  

## Troubleshooting

- **401 on create-checkout-session:** User must be signed in.
- **Webhook 400 / invalid signature:** Wrong `STRIPE_WEBHOOK_SECRET` or body parsed as JSON (route must receive raw body — already configured in implementation).
- **Credits not applied:** Check server logs for `[webhooks/stripe]`, Stripe Dashboard → Webhooks → attempt logs, and that metadata (`userId`, `planId`, etc.) is present on the session.
