# MPUI-KIT

Open-source [shadcn/ui](https://ui.shadcn.com) components for African markets: Mobile Money checkout, FCFA currency, local phone numbers, bilingual FR/EN forms, and UX that holds up on slow connections and low-end phones.

Cameroon is the first supported country. Country data is pluggable, so adding another country is a pull request, not a fork. See [Add your country](./CONTRIBUTING.md#add-your-country).

<!-- TODO: replace with a GIF of the momo-checkout demo -->

> _GIF placeholder: live checkout demo (FR/EN toggle, phone approval, receipt)._

> **Status: pre-release (0.1.0 in development).** The components below are being built one at a time. Nothing here is published yet: the install commands below use the domain the docs site will be deployed to, but it is not live.

## Why

Generic checkout components assume cards, `$` and 10-digit US phone numbers. In much of Africa, people pay with Mobile Money, prices are in FCFA with no decimals, phone numbers identify the operator, and users switch between French and English on a slow connection. MPUI-KIT ships those defaults as copy-paste components you own, like the rest of shadcn/ui.

## Install

Components are distributed through a shadcn registry. Register the `@mpui-kit` namespace once:

```bash
npx shadcn@latest registry add @mpui-kit=https://mpui-kit.vercel.app/r/{name}.json
```

or add it to your `components.json` yourself:

```json
{
  "registries": {
    "@mpui-kit": "https://mpui-kit.vercel.app/r/{name}.json"
  }
}
```

Then install by name. Shared pieces, such as the country types, are installed automatically:

```bash
npx shadcn@latest add @mpui-kit/currency
npx shadcn@latest add @mpui-kit/country-cm
npx shadcn@latest add @mpui-kit/momo-checkout
```

Files are added under `lib/mpui-kit/` and `components/mpui-kit/` (or `src/lib/mpui-kit/` and `src/components/mpui-kit/` if your project uses `src/`).

The namespace is required because items depend on each other by `@mpui-kit/<name>`. `mpui-kit.vercel.app` is where the docs site will be deployed; the commands above will not work until it is live.

## Requirements

- **Tailwind CSS v4.** The components are styled with Tailwind classes. An app without Tailwind gets no styling from them.
- **shadcn/ui** set up with CSS variables (`npx shadcn@latest init`), so the theme tokens the components read exist.
- **React 19.** Several components take `ref` as a normal prop.
- **`tw-animate-css`** for the entrance animations. `shadcn init` installs it. Without it the animations are simply skipped and nothing else changes. All motion is off for users who ask for reduced motion.

Because they use your tokens, the components follow your theme, radius and dark mode. Larger components also take a `classNames` prop and mark every part with a `data-slot` attribute. See the Theming page in the docs.

## Components

Phase 1:

| Name                    | Type            | What it does                                                                                                                             |
| ----------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `currency`              | component + lib | Formats FCFA (XAF/XOF): zero decimals, French spacing (`25 000 FCFA`), `FCFA` or ISO code.                                               |
| `phone-input`           | component       | Detects the operator from the prefix as you type, validates length, returns E.164. Works with react-hook-form and zod.                   |
| `payment-method-picker` | component       | Selectable cards for Mobile Money operators, card and cash. Reveals the phone input inline.                                              |
| `ussd-prompt`           | component       | Approval code with copy button and `tel:` link, waiting animation, countdown and retry.                                                  |
| `momo-checkout`         | block           | Full checkout: idle → awaiting approval → success / failed / timeout, plus a receipt card. Host card or PayPal fields in a panel (beta). |
| `method-panel`          | types           | (Beta) The contract for a payment method's panel. Card details never enter MPUI-KIT: your provider's fields return a token.              |

### Headless and framework-free

The logic is separate from the UI. `registry/mpui-kit/lib/core` has no React and no dependencies, and `@mpui-kit/core` (not published yet) is built from it, so you can use the checkout controller, phone field and countdown with Vue, Svelte or plain JavaScript. See [packages/core](./packages/core/README.md) and the Headless guide in the docs.

Planned: landmark-based address input, OTP input, FCFA range slider, French date picker, WhatsApp button and chat widget, network banner, data-saver image, low-data mode provider, transaction timeline, listing card block, pricing table block.

## Design principles

- **No hardcoded country.** Components take a `country` prop or read it from `MpuiKitProvider`. Operators, prefixes, currency, locales and regions live in `registry/mpui-kit/lib/countries/<iso>.ts`.
- **UI only.** No payment API calls. Payment flows take async callbacks (`onPay`, `onCheckStatus`), so they work with any backend or aggregator.
- **Accessible by default.** Labelled inputs, keyboard navigation, `aria-live` for payment states, `prefers-reduced-motion` respected.
- **Bilingual.** Every string goes through a small FR/EN dictionary that you can override.
- **Light.** No animation library, minimal client JS.
- **No brand assets.** Operators appear as a name plus a neutral color dot. You can pass your own logos through props.

## Data accuracy

Cameroon's operator prefixes were verified by the maintainer against the ART numbering plan on 2026-09-28. Region and city names are still unverified community data, marked `// TODO: verify region and city lists`. Number allocations can still be reassigned over time, so do not use prefix detection for anything that must be correct, such as routing money. Use it as a UX hint and confirm with your payment provider.

## Development

```bash
pnpm install
pnpm dev             # docs site at http://localhost:3000
pnpm test            # unit tests
pnpm lint
pnpm typecheck
pnpm registry:check  # checks registry.json against the source files
pnpm registry:build  # runs `shadcn build` into public/r
pnpm build           # checks the registry, builds it, then builds the site
pnpm size            # checks the JavaScript each page loads, after a build
```

## Disclaimer

MPUI-KIT is an independent project. It is **not affiliated with, endorsed by, or sponsored by** any mobile network operator, mobile money provider, bank or payment company. Operator names appear only to identify the service a user is paying with. All trademarks belong to their owners.

## License

[MIT](./LICENSE)
