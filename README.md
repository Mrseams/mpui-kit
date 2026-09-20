# mboa-ui

Open-source [shadcn/ui](https://ui.shadcn.com) components for African markets: Mobile Money checkout, FCFA currency, local phone numbers, bilingual FR/EN forms, and UX that holds up on slow connections and low-end phones.

Cameroon is the first supported country. Country data is pluggable, so adding another country is a pull request, not a fork. See [Add your country](./CONTRIBUTING.md#add-your-country).

<!-- TODO: replace with a GIF of the momo-checkout demo -->

> _GIF placeholder: live checkout demo (FR/EN toggle, phone approval, receipt)._

> **Status: pre-release (0.1.0 in development).** The components below are being built one at a time. Nothing here is published yet, and the install URLs are placeholders until the docs site is deployed.

## Why

Generic checkout components assume cards, `$` and 10-digit US phone numbers. In much of Africa, people pay with Mobile Money, prices are in FCFA with no decimals, phone numbers identify the operator, and users switch between French and English on a slow connection. mboa-ui ships those defaults as copy-paste components you own, like the rest of shadcn/ui.

## Install

Components are distributed through a shadcn registry. Register the `@mboa` namespace once:

```bash
npx shadcn@latest registry add @mboa=https://<your-docs-domain>/r/{name}.json
```

or add it to your `components.json` yourself:

```json
{
  "registries": {
    "@mboa": "https://<your-docs-domain>/r/{name}.json"
  }
}
```

Then install by name. Shared pieces, such as the country types, are installed automatically:

```bash
npx shadcn@latest add @mboa/currency
npx shadcn@latest add @mboa/country-cm
npx shadcn@latest add @mboa/momo-checkout
```

Files are added under `lib/mboa/` and `components/mboa/` (or `src/lib/mboa/` and `src/components/mboa/` if your project uses `src/`).

The namespace is required because items depend on each other by `@mboa/<name>`. `<your-docs-domain>` is a placeholder until the site is deployed.

## Requirements

- **Tailwind CSS v4.** The components are styled with Tailwind classes. An app without Tailwind gets no styling from them.
- **shadcn/ui** set up with CSS variables (`npx shadcn@latest init`), so the theme tokens the components read exist.
- **React 19.** Several components take `ref` as a normal prop.

Because they use your tokens, the components follow your theme, radius and dark mode. Larger components also take a `classNames` prop and mark every part with a `data-slot` attribute. See the Theming page in the docs.

## Components

Phase 1:

| Name                    | Type            | What it does                                                                                                           |
| ----------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `currency`              | component + lib | Formats FCFA (XAF/XOF): zero decimals, French spacing (`25 000 FCFA`), `FCFA` or ISO code.                             |
| `phone-input`           | component       | Detects the operator from the prefix as you type, validates length, returns E.164. Works with react-hook-form and zod. |
| `payment-method-picker` | component       | Selectable cards for Mobile Money operators, card and cash. Reveals the phone input inline.                            |
| `ussd-prompt`           | component       | Approval code with copy button and `tel:` link, waiting animation, countdown and retry.                                |
| `momo-checkout`         | block           | Full checkout: idle → awaiting approval → success / failed / timeout, plus a receipt card.                             |

Planned: landmark-based address input, OTP input, FCFA range slider, French date picker, WhatsApp button and chat widget, network banner, data-saver image, low-data mode provider, transaction timeline, listing card block, pricing table block.

## Design principles

- **No hardcoded country.** Components take a `country` prop or read it from `MboaProvider`. Operators, prefixes, currency, locales and regions live in `registry/mboa/lib/countries/<iso>.ts`.
- **UI only.** No payment API calls. Payment flows take async callbacks (`onPay`, `onCheckStatus`), so they work with any backend or aggregator.
- **Accessible by default.** Labelled inputs, keyboard navigation, `aria-live` for payment states, `prefers-reduced-motion` respected.
- **Bilingual.** Every string goes through a small FR/EN dictionary that you can override.
- **Light.** No animation library, minimal client JS.
- **No brand assets.** Operators appear as a name plus a neutral color dot. You can pass your own logos through props.

## Data accuracy

Operator prefixes and region lists are community-maintained data, not an authoritative source. Cameroon's prefixes are marked `// TODO: verify against current ART allocation`. Number allocations change, so do not use prefix detection for anything that must be correct, such as routing money. Use it as a UX hint and confirm with your payment provider.

## Development

```bash
pnpm install
pnpm dev             # docs site at http://localhost:3000
pnpm test            # unit tests
pnpm lint
pnpm typecheck
pnpm registry:check  # checks registry.json against the source files
pnpm registry:build  # runs `shadcn build` into public/r
```

## Disclaimer

mboa-ui is an independent project. It is **not affiliated with, endorsed by, or sponsored by** any mobile network operator, mobile money provider, bank or payment company. Operator names appear only to identify the service a user is paying with. All trademarks belong to their owners.

## License

[MIT](./LICENSE)
