---
name: checkout-card-integration
description: How to use the MomoCheckout block with card, PayPal or any other provider through payment panels (beta) — method setup, the MethodPanel contract, Stripe and PayPal panels, what onPay receives, and the server-side and security rules. Use when the user asks to add card payments, Stripe, PayPal, a wallet or a custom payment method to the checkout, write or debug a panel, or wire onPay/onCheckStatus to a backend.
---

# Card and PayPal in the checkout (beta)

The source of truth is the code; read it before answering or writing an integration:

| What                                       | File                                                |
| ------------------------------------------ | --------------------------------------------------- |
| Panel contract (`MethodPanel`, props)      | `registry/mpui-kit/components/method-panel.ts`      |
| Checkout props (`panels`, `methods`, ...)  | `registry/mpui-kit/components/momo-checkout.tsx`    |
| `onPay` / `onCheckStatus` types            | `registry/mpui-kit/lib/core/checkout-controller.ts` |
| `PaymentMethod`, `defaultPaymentMethods()` | `registry/mpui-kit/lib/payment-methods.ts`          |
| Working Stripe panel                       | `components/site/stripe-card-panel.tsx`             |
| Working PayPal panel                       | `components/site/paypal-panel.tsx`                  |
| Demo wiring and the published guide        | `app/docs/guides/card-and-paypal/`                  |

Always say the panel API is **beta and may change before 1.0**. Mobile Money and cash are not
affected.

## The rule that must never be broken

**Card details never enter MPUI-KIT or the app's own code.** The provider's hosted fields
(Stripe's Payment Element, PayPal's Buttons) keep them in their iframe. The panel hands back an
opaque token (Stripe confirmation token id, PayPal order id); the checkout passes it to `onPay` as
`payload` and never shows it on the receipt. Never write a panel with plain `<input>`s for card
number, expiry or CVC, and never log or store raw card data — refuse and explain if asked.

## 1. Install

In a project that already uses shadcn/ui (with tw-animate-css):

```bash
npx shadcn@latest registry add @mpui-kit=https://mpui-kit.vercel.app/r/{name}.json
npx shadcn@latest add @mpui-kit/country-cm @mpui-kit/mpui-kit-provider @mpui-kit/momo-checkout
```

`momo-checkout` pulls in `method-panel`. Then install the provider SDKs the user needs:
`@stripe/stripe-js @stripe/react-stripe-js` and/or `@paypal/react-paypal-js`.

## 2. Declare the methods and map panels by method id

```tsx
const methods: PaymentMethod[] = [
  ...defaultPaymentMethods(cm, { card: false, cash: false }), // Mobile Money operators
  { id: "card", kind: "card" },
  { id: "paypal", kind: "other", label: "PayPal", description: "Pay with your PayPal account" },
]

<MomoCheckout
  amount={25000}                // CFA francs
  methods={methods}
  panels={{
    card: { component: StripeCardPanel },                  // submit: "checkout" (default)
    paypal: { component: PayPalPanel, submit: "panel" },   // PayPal's button is the Pay button
  }}
  methodIcons={{ paypal: <PayPalLogo /> }}                 // optional; kit ships no logos
  onPay={onPay}
  onCheckStatus={onCheckStatus}  // only needed if onPay can return "pending"
/>
```

`kind: "other"` takes any `label`/`description`. The `panels` key must equal the method `id`.
Define each panel component at module level, never inline (`component: (p) => ...` inside a
render): the checkout renders `panel.component` directly, so a new function each render remounts
the provider's fields and wipes what the customer typed.

## 3. Write the panel — pick the submit mode

**`submit: "checkout"` (default, e.g. Stripe):** the checkout's Pay button submits.

- Call `setReady(true/false)` from the provider's change event (`event.complete`). Until ready,
  Pay asks the customer to finish and pays nothing.
- In a `useEffect`, call `setCollect(async () => token)` and return `() => setCollect(null)`.
  The collect function returns the payload for `onPay`. On error, call `setError(message)` first,
  then **throw** — nothing is paid.
- Respect `disabled` (e.g. `readOnly: disabled`) while the checkout is busy.
- Copy `components/site/stripe-card-panel.tsx`: `elements.submit()`, then
  `stripe.createConfirmationToken({ elements })`, return `{ confirmationTokenId }`.

**`submit: "panel"` (e.g. PayPal):** the panel pays by itself and the Pay button is hidden.

- Call `submit(payload)` when the provider approves (PayPal `onApprove` →
  `submit({ orderId: data.orderID })`), and `setError(...)` on provider errors.
- **Create the PayPal order on the server** (`createOrder` fetches the app's own endpoint and
  returns the id). `components/site/paypal-panel.tsx` creates it in the browser from a fixed
  amount **only because the demo has no server** — never copy that part into a real app.

Panels are ordinary React components: they can use hooks and wrap themselves in the provider's
context (`<Elements>`, `<PayPalScriptProvider>`). Load the SDK once (module-level promise, as
`getStripe()` does).

## 4. Handle `onPay` (and `onCheckStatus`)

`onPay(request)` receives `{ methodId, phone?, payload?, amount, currency, attempt, signal }` and
must return one of:

- `{ status: "success", reference }` — paid already.
- `{ status: "pending", reference, ussdCode? }` — the checkout then polls `onCheckStatus(reference)`
  every `pollIntervalMs` (default 3 s) until `timeoutMs` (default 2 min).
- `{ status: "failed", reason? }` — `reason` is mapped through `failureMessages`; raw backend
  text is never shown to the customer.

Pass `signal` to `fetch` so a cancel or timeout aborts the request. Use `attempt` in an
idempotency key so a retry does not charge twice.

## 5. Server side — non-negotiable

- **Never trust an amount from the browser.** The server reads the price from its own data when
  it creates the Stripe PaymentIntent or the PayPal order.
- The token proves nothing by itself. The server creates and confirms the charge with the token
  (Stripe: confirm a PaymentIntent with the confirmation token; PayPal: capture the order), using
  the secret key that only the server has. Check the provider's current docs for the exact call.
- The provider's **webhook is the source of truth**; the checkout's success state is UX only.

## 6. Before going live

- **Currency**: Stripe and PayPal do not currently process CFA francs (XAF/XOF). The card or PayPal
  charge is usually in another currency (e.g. EUR or USD): convert on the server and show the
  customer that amount. The demos use USD placeholders for this reason.
- **Keys**: set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_PAYPAL_CLIENT_ID` to the app's
  own keys. The demo fallbacks (`pk_test_TYoo...`, `"sb"`) are public test credentials only.
  Secret keys stay on the server, never in `NEXT_PUBLIC_*`.
- **Logos**: only through `methodIcons`, following the brand's guidelines.
- **Tests**: use Stripe's test card `4242 4242 4242 4242`, any future expiry, any CVC.

## Troubleshooting

- _Pay does nothing / "finish the details"_ → `setReady(true)` was never called.
- _Pay is pressed but `onPay` gets no payload_ → `setCollect` not registered (effect ran before
  `stripe`/`elements` were ready, or the cleanup cleared it); `submit: "panel"` without calling
  `submit(...)`.
- _Both Pay button and PayPal button show_ → the panel was registered without `submit: "panel"`.
- _PayPal script fails to attach_ → an element with `id="paypal"` on the page shadows
  `window.paypal`; rename the id (the guide uses `paypal-example`).
- _Panel does not appear_ → the `panels` key does not match the method `id`.
