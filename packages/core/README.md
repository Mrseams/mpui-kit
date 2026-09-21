# @mpkit/core

The framework-free core of [MP Kit](../../README.md): a Mobile Money checkout controller, phone number and FCFA helpers, and French and English strings, for African markets.

It has **no dependencies** and no UI. It works in the browser and in Node, with React, Vue, Svelte, Solid or plain JavaScript. If you use React and shadcn/ui, the [components](../../README.md) are built on this package.

> **Status: pre-release.** Not published yet. Country data is community data, not an authoritative source.

## What is in it

|                                                |                                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `createCheckoutController`                     | The payment flow: idle, awaiting approval, success, failed, timeout, with retry. You give it `onPay` and `onCheckStatus`. |
| `createPhoneField` / `applyPhoneEdit`          | A phone field: groups digits as you type, keeps the caret in place, detects the operator, validates.                      |
| `createCountdown`                              | A countdown that ticks on the second and survives frozen background tabs.                                                 |
| `formatFcfa`, `validatePhone`, `dialHref`, ... | Pure helpers.                                                                                                             |
| `createTranslator`, `messages`                 | The FR/EN dictionary.                                                                                                     |
| `cm`, `prefixRange`, `CountryConfig`           | Cameroon data and the type for adding your country.                                                                       |

Every controller has the same small shape: `getSnapshot()` returns the current state (the same object until something changes), and `subscribe(listener)` tells you when it changes. That is exactly what `useSyncExternalStore`, a Vue `shallowRef`, a Svelte store or a plain `render()` need.

## Plain JavaScript

This example runs, in a real browser, as [`vanilla.html`](../../public/examples/vanilla.html).

```js
import { cm, createCheckoutController, createPhoneField, formatFcfa } from "@mpkit/core"

const field = createPhoneField({ country: cm })
input.addEventListener("input", () => {
  const { formatted, caretIndex } = field.input(input.value, input.selectionStart ?? undefined)
  input.value = formatted
  if (caretIndex !== null) input.setSelectionRange(caretIndex, caretIndex)
})

const checkout = createCheckoutController({
  amount: 25000,
  currency: "XAF",
  onPay: async ({ methodId, phone }) => {
    // Call YOUR backend. MP Kit never talks to a payment provider.
    const { reference } = await startPayment({ methodId, phone })
    return { status: "pending", reference }
  },
  onCheckStatus: async (reference) => fetchStatus(reference), // { status: "pending" | "success" | "failed" }
})

checkout.subscribe(() => render(checkout.getSnapshot()))
checkout.pay({ methodId: "mtn", phone: field.getSnapshot().validation.e164 })
```

## React

```tsx
import { useSyncExternalStore } from "react"

const state = useSyncExternalStore(checkout.subscribe, checkout.getSnapshot)
```

The shadcn/ui package ships this as `useMomoCheckout`.

## Vue and Svelte

These are sketches of the adapter, **not run in this repository's tests**. The controller does the same thing in every framework, so only the wiring differs.

```ts
// Vue 3
import { shallowRef, onUnmounted } from "vue"

export function useCheckout(options) {
  const controller = createCheckoutController(options)
  const snapshot = shallowRef(controller.getSnapshot())
  const stop = controller.subscribe(() => (snapshot.value = controller.getSnapshot()))
  onUnmounted(() => {
    stop()
    controller.destroy()
  })
  return { snapshot, pay: controller.pay, retry: controller.retry, cancel: controller.cancel }
}
```

```js
// Svelte: a controller is already a store, because it has subscribe().
// Svelte calls the callback with the current value straight away, so wrap getSnapshot.
import { readable } from "svelte/store"

const snapshot = readable(controller.getSnapshot(), (set) =>
  controller.subscribe(() => set(controller.getSnapshot()))
)
```

## Payments and security

The core never calls a payment provider and never asks for card details. To take cards or PayPal, use your provider's own hosted fields or buttons and pass the token they give you to `pay({ methodId, payload })`. It reaches your `onPay` untouched and never appears in the receipt. Always confirm a payment on your server before you deliver anything: the receipt shows what your backend reported.

## License

MIT
