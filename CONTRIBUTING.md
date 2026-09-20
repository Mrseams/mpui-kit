# Contributing to mboa-ui

Thanks for helping. The most valuable contribution is often data: a new country, or a correction to an existing one.

## Setup

```bash
pnpm install
pnpm dev
```

Before opening a pull request, run:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm registry:build
```

CI runs the same commands.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org): `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`. Use a scope when it helps, for example `feat(phone-input): detect operator on paste` or `feat(countries): add Senegal`.

## Project layout

| Path                   | Purpose                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `registry/countries/`  | One file per country, plus `types.ts`.                                                    |
| `registry/lib/`        | Framework-free logic (formatting, phone parsing, state machine, i18n). Fully unit-tested. |
| `registry/components/` | Components distributed to users.                                                          |
| `registry/blocks/`     | Larger compositions, such as `momo-checkout`.                                             |
| `app/`                 | The docs site and landing page.                                                           |
| `registry.json`        | The registry manifest. `shadcn build` turns it into `public/r/*.json`.                    |

## Add your country

Adding a country touches data files only. No component changes are needed, because components read everything from a `CountryConfig`.

1. **Copy the template.** Copy `registry/countries/cm.ts` to `registry/countries/<iso>.ts`, using the lowercase ISO 3166-1 alpha-2 code (for example `sn.ts`).

2. **Fill in the config.** See `registry/countries/types.ts` for every field.

   - `callingCode`, `nationalNumberLength` and `trunkPrefix` (only if people dial a leading digit domestically).
   - `groupSizes`: how the number is written, for example `[1, 2, 2, 2, 2]`. It must sum to `nationalNumberLength`.
   - `currency`: `XAF` or `XOF`.
   - `locales` and `defaultLocale`: `fr` and/or `en`.
   - `operators`: `id`, `name`, a neutral `color`, and `prefixes`. Add `mobileMoneyName` only if the operator offers a mobile money wallet.
   - `regions`: each region with a bilingual name and its main cities.

3. **Use real sources, and be honest about them.** Take numbering plans from the national telecom regulator or the ITU, and say which source in your pull request. If you cannot confirm a prefix, add `// TODO: verify against <regulator> allocation` above it, as `cm.ts` does. Do not present unverified data as authoritative.

4. **No logos or brand assets.** Operators are a name plus a neutral color. Do not add logos, brand-exact colors or trademarked images.

5. **Register the country.** Add it to `registry/countries/index.ts`:

   ```ts
   import { sn } from "@/registry/countries/sn"
   export const countries = { cm, sn } satisfies Record<string, CountryConfig>
   ```

6. **Run the tests.** `pnpm test` runs a check against every country in the index: duplicate operator ids, overlapping prefixes, group sizes that do not add up, and more. Fix anything it reports.

7. **Add a registry item.** In `registry.json`, add a `country-<iso>` entry modelled on `country-cm`, so people can install just that country.

8. **Add tests for anything unusual.** If your country has a trunk prefix or an unusual number format, add a case in `registry/lib/phone.test.ts`.

9. **Open the pull request.** Include your sources and note anything you could not verify.

### Correcting existing data

Prefix or region corrections are welcome. Open a pull request (or a "Country data" issue) with a link to the source that shows the current allocation.

## Guidelines for components

- **Never hardcode a country.** Take a `country` prop or read from `MboaProvider`.
- **UI only.** No real payment API calls. Accept async callbacks instead.
- **Accessible by default.** Labels, keyboard navigation, `aria-live` for async states, and respect `prefers-reduced-motion`.
- **Every user-facing string goes through `registry/lib/i18n.ts`,** in both French and English.
- **Keep it light.** Avoid heavy dependencies and animation libraries. The audience often has slow connections and low-end phones.
- **Test the logic.** Put logic in `registry/lib/` as pure functions and unit-test it.

## Reporting bugs

Use the issue templates. For payment-related bugs, do not paste real phone numbers, PINs or transaction details.
