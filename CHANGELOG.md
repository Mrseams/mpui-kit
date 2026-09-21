# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [0.1.0] - Unreleased

Initial release. Phase 1.

### Added

- Country data model (`CountryConfig`) and Cameroon (`cm`), with operator prefixes marked for verification against the current ART allocation.
- `formatFcfa` and `<Currency />`: FCFA (XAF/XOF) formatting with zero decimals and French spacing.
- Phone parsing: operator detection from prefix, length validation, E.164 output.
- `<PhoneInput />`, `<PaymentMethodPicker />`, `<UssdPrompt />`.
- `momo-checkout` block with an idle → awaiting approval → success / failed / timeout state machine and a receipt card.
- FR/EN dictionary and `MpKitProvider`.
- Docs site with a landing page and a live apartment-booking demo (priced per night in FCFA, a mocked `onPay` that simulates the phone approval delay, and a FR/EN toggle), a playground, and a docs page for every component.
- A Theming guide. Larger components take `classNames` and mark every part with a `data-slot` attribute; the receipt checkmark uses `--success` or `--primary`.
- A dark mode toggle that follows the system until you choose, and Poppins as the site font, self-hosted.
- A framework-free core (`registry/mpkit/lib/core`): `createCheckoutController`, `createPhoneField` and `createCountdown`, each with `getSnapshot()` and `subscribe()`, so they work with React, Vue, Svelte or plain JavaScript. The React hooks (`useMomoCheckout`, `usePhoneField`, `useCountdown`) are thin wrappers over them. A plain-JavaScript demo runs at `/examples/vanilla.html`.
- `@mpkit/core`: the same core as an npm package (ESM, CommonJS and types). Built and checked in this repository, **not published yet**.
- A configurable checkout. Card and PayPal support is **beta**: the panel API may change before 1.0. Give a payment method a `panel` to host your provider's own card fields or PayPal buttons: the panel returns an opaque token that reaches `onPay` as `payload`, and card details never enter MP Kit. Also `methodIcons`, `submitLabel`, `submitDisabled`, `footer`, a new `"other"` method kind, and `methodLabel` on the receipt.
- A guide for card and PayPal, marked beta (with a simulated demo, and Stripe Elements and PayPal Buttons sketches that have **not** been run against those services) and a guide to the headless core.
- Polish: symmetrical layouts, entrance animations that respect `prefers-reduced-motion`, and a redesigned USSD prompt and receipt.
- `pnpm registry:check` to verify that every registry item ships what it imports, and `pnpm size` to keep the pages light.
