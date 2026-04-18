# Payments

## Goal
Sell credits via Stripe. Users pay once and receive a token that unlocks additional comment-fetch credits.

## Implementation
Two-step flow in `server/routes.ts`:
1. `POST /api/payment/create-intent` — creates a Stripe PaymentIntent server-side, returns `clientSecret` to the frontend.
2. `POST /api/payment/confirm` — called after Stripe Elements confirms payment; verifies the PaymentIntent succeeded, generates a one-time token, stores it in the credit system.

Frontend uses Stripe Elements (loaded via `client/src/lib/stripe.ts`) for PCI-compliant card collection. After payment, user redeems the token at `POST /api/credits/redeem` to add credits to their IP.

## Key Code
```typescript
// routes.ts
app.post('/api/payment/create-intent', async (req, res) => {
  const intent = await stripe.paymentIntents.create({ amount, currency: 'gbp' });
  res.json({ clientSecret: intent.client_secret });
});
```

## Notes
- `STRIPE_SECRET_KEY` is server-only — never sent to client
- `STRIPE_PUBLISHABLE_KEY` served to frontend via `GET /api/config`
- Credits are IP-based, not account-based — 2 free credits per IP, additional via token redemption
- Test mode: use Stripe test keys and card `4242 4242 4242 4242`
