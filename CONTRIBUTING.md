# Contributing to mboa-ui

Thanks for helping. The most valuable contribution is often data: a new country, or a correction to an existing one.

## Setup

```bash
pnpm install
pnpm dev
```

Before opening a pull request, run:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm registry:check && pnpm build && pnpm size
```

CI runs the same commands.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org): `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`. Use a scope when it helps, for example `feat(phone-input): detect operator on paste` or `feat(countries): add Senegal`.

## Project layout

| Path                           | Purpose                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `registry/mboa/lib/countries/` | One file per country, plus `types.ts`.                                                    |
| `registry/mboa/lib/`           | Framework-free logic (formatting, phone parsing, state machine, i18n). Fully unit-tested. |
| `registry/mboa/components/`    | Components and blocks distributed to users.                                               |
| `app/`                         | The docs site and landing page.                                                           |
| `registry.json`                | The registry manifest. `shadcn build` turns it into `public/r/*.json`.                    |

### Import paths in registry files

Files under `registry/mboa/` import each other with the path they will have in a user's project, not the path they have in this repo:

```ts
import { formatFcfa } from "@/lib/mboa/format-fcfa" // registry/mboa/lib/format-fcfa.ts here
import { PhoneInput } from "@/components/mboa/phone-input" // registry/mboa/components/phone-input.tsx here
```

`tsconfig.json` and `vitest.config.mts` map these back to `registry/mboa/`. Every file in `registry.json` needs a matching `target` (for example `lib/mboa/format-fcfa.ts`), so the installed file lands where the imports expect it. Do not import from `@/registry/...`: the shadcn CLI would not rewrite that path for users.

`pnpm registry:check` verifies this for you. For every item it checks that each import is provided by the item or its dependencies, that npm packages are listed in `dependencies`, that shadcn primitives are listed in `registryDependencies`, and that no source file is left out of the registry. Run it after adding or changing a file.

## Add your country

Adding a country touches data files only. No component changes are needed, because components read everything from a `CountryConfig`.

1. **Copy the template.** Copy `registry/mboa/lib/countries/cm.ts` to `registry/mboa/lib/countries/<iso>.ts`, using the lowercase ISO 3166-1 alpha-2 code (for example `sn.ts`).

2. **Fill in the config.** See `registry/mboa/lib/countries/types.ts` for every field.

   - `callingCode`, `nationalNumberLength` and `trunkPrefix` (only if people dial a leading digit domestically).
   - `groupSizes`: how the number is written, for example `[1, 2, 2, 2, 2]`. It must sum to `nationalNumberLength`.
   - `currency`: `XAF` or `XOF`.
   - `locales` and `defaultLocale`: `fr` and/or `en`.
   - `operators`: `id`, `name`, a neutral `color`, and `prefixes`. Add `mobileMoneyName` only if the operator offers a mobile money wallet. Regulators publish ranges, so use `prefixRange("650", "653")` from `prefix-range.ts` instead of typing every prefix.
   - `regions`: each region with a bilingual name and its main cities.

3. **Use real sources, and be honest about them.** Take numbering plans from the national telecom regulator or the ITU, and say which source in your pull request. If you cannot confirm a prefix, add `// TODO: verify against <regulator> allocation` above it, as `cm.ts` does. Do not present unverified data as authoritative.

4. **No logos or brand assets.** Operators are a name plus a neutral color. Do not add logos, brand-exact colors or trademarked images.

5. **Register the country.** Add it to `registry/mboa/lib/countries/index.ts`:

   ```ts
   import { sn } from "@/lib/mboa/countries/sn"
   export const countries = { cm, sn } satisfies Record<string, CountryConfig>
   ```

6. **Run the tests.** `pnpm test` runs a check against every country in the index: duplicate operator ids, overlapping prefixes, group sizes that do not add up, and more. Fix anything it reports.

7. **Add a registry item.** In `registry.json`, add a `country-<iso>` entry modelled on `country-cm`, so people can install just that country.

8. **Add tests for anything unusual.** If your country has a trunk prefix or an unusual number format, add a case in `registry/mboa/lib/phone.test.ts`.

9. **Open the pull request.** Include your sources and note anything you could not verify.

### Correcting existing data

Prefix or region corrections are welcome. Open a pull request (or a "Country data" issue) with a link to the source that shows the current allocation.

## Keeping it light

The audience often has slow connections and low-end phones. `pnpm size` (run it after `pnpm build`) checks how much JavaScript each docs page loads up front against a budget, and that the landing page demo stays lazy. If your change goes over a budget, look for something to remove or load later before raising the budget.

## Guidelines for components

- **Never hardcode a country.** Take a `country` prop or read from `MboaProvider`.
- **UI only.** No real payment API calls. Accept async callbacks instead.
- **Accessible by default.** Labels, keyboard navigation, `aria-live` for async states, and respect `prefers-reduced-motion`.
- **Every user-facing string goes through `registry/mboa/lib/i18n.ts`,** in both French and English.
- **Keep it light.** Avoid heavy dependencies and animation libraries. The audience often has slow connections and low-end phones.
- **Test the logic.** Put logic in `registry/mboa/lib/` as pure functions and unit-test it.

## Reporting bugs

Use the issue templates. For payment-related bugs, do not paste real phone numbers, PINs or transaction details.
