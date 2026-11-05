# Contributing to MPUI-KIT

Thanks for helping. The most valuable contribution is often data: a new country, or a correction to an existing one.

By taking part you agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md). To report a security problem, see [SECURITY.md](./SECURITY.md).

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

| Path                           | Purpose                                                                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/countries/` | One file per country, plus `types.ts`.                                                                                                                                                |
| `packages/core/src/`           | `@mpui-kit/core`: framework-free logic (formatting, phone parsing, state machine, i18n). Fully unit-tested. Shipped through the registry and built for npm.                           |
| `packages/ui/src/`             | `@mpui-kit/ui` (private): React components, blocks and hooks distributed through the registry. `src/shadcn/` holds stand-ins for the user's shadcn primitives and is not distributed. |
| `apps/docs/`                   | `@mpui-kit/docs`: the docs site and landing page (Next.js).                                                                                                                           |
| `registry.json`                | The registry manifest. `shadcn build` turns it into `apps/docs/public/r/*.json`.                                                                                                      |

The repository is a pnpm workspace driven by [Turborepo](https://turbo.build). Run every command from the root: `pnpm test`, `pnpm build` and `pnpm typecheck` run in each workspace, in dependency order.

### Import paths in registry files

Files under `packages/core/src/` and `packages/ui/src/` import each other with the path they will have in a user's project, not the path they have in this repo:

```ts
import { formatFcfa } from "@/lib/mpui-kit/format-fcfa" // packages/core/src/format-fcfa.ts here
import { PhoneInput } from "@/components/mpui-kit/phone-input" // packages/ui/src/components/phone-input.tsx here
```

Each workspace's `tsconfig.json` and `vitest.config.mts` map these back to the source folders. Every file in `registry.json` needs a matching `target` (for example `lib/mpui-kit/format-fcfa.ts`), so the installed file lands where the imports expect it. Do not import from `@/registry/...`: the shadcn CLI would not rewrite that path for users.

`pnpm registry:check` verifies this for you. For every item it checks that each import is provided by the item or its dependencies, that npm packages are listed in `dependencies`, that shadcn primitives are listed in `registryDependencies`, and that no source file is left out of the registry. Run it after adding or changing a file.

## Add your country

Adding a country touches data files only. No component changes are needed, because components read everything from a `CountryConfig`.

1. **Copy the template.** Copy `packages/core/src/countries/cm.ts` to `packages/core/src/countries/<iso>.ts`, using the lowercase ISO 3166-1 alpha-2 code (for example `sn.ts`).

2. **Fill in the config.** See `packages/core/src/countries/types.ts` for every field.

   - `callingCode`, `nationalNumberLength` and `trunkPrefix` (only if people dial a leading digit domestically).
   - `groupSizes`: how the number is written, for example `[1, 2, 2, 2, 2]`. It must sum to `nationalNumberLength`.
   - `currency`: `XAF` or `XOF`.
   - `locales` and `defaultLocale`: `fr` and/or `en`.
   - `operators`: `id`, `name`, a neutral `color`, and `prefixes`. Add `mobileMoneyName` only if the operator offers a mobile money wallet. Regulators publish ranges, so use `prefixRange("650", "653")` from `prefix-range.ts` instead of typing every prefix.
   - `regions`: each region with a bilingual name and its main cities.

3. **Use real sources, and be honest about them.** Take numbering plans from the national telecom regulator or the ITU, and say which source in your pull request. If you cannot confirm a prefix, add `// TODO: verify against <regulator> allocation` above it, as `cm.ts` does for its region and city list. Do not present unverified data as authoritative.

4. **No logos or brand assets.** Operators are a name plus a neutral color. Do not add logos, brand-exact colors or trademarked images.

5. **Register the country.** Add it to `packages/core/src/countries/index.ts`:

   ```ts
   import { sn } from "@/lib/mpui-kit/countries/sn"
   export const countries = { cm, sn } satisfies Record<string, CountryConfig>
   ```

6. **Run the tests.** `pnpm test` runs a check against every country in the index: duplicate operator ids, overlapping prefixes, group sizes that do not add up, and more. Fix anything it reports.

7. **Add a registry item.** In `registry.json`, add a `country-<iso>` entry modelled on `country-cm`, so people can install just that country.

8. **Add tests for anything unusual.** If your country has a trunk prefix or an unusual number format, add a case in `packages/core/src/phone.test.ts`.

9. **Open the pull request.** Include your sources and note anything you could not verify.

### Correcting existing data

Prefix or region corrections are welcome. Open a pull request (or a "Country data" issue) with a link to the source that shows the current allocation.

## Keeping it light

The audience often has slow connections. `pnpm size` (run it after `pnpm build`) checks how much JavaScript each docs page loads up front against a budget, and that the landing page demo stays lazy. If your change goes over a budget, look for something to remove or load later before raising the budget.

## Guidelines for components

- **Never hardcode a country.** Take a `country` prop or read from `MpuiKitProvider`.
- **UI only.** No real payment API calls. Accept async callbacks instead.
- **Accessible by default.** Labels, keyboard navigation, `aria-live` for async states, and respect `prefers-reduced-motion`.
- **Every user-facing string goes through `packages/core/src/i18n.ts`,** in both French and English.
- **Keep it light.** Avoid heavy dependencies and animation libraries. The audience often has slow connections.
- **Test the logic.** Put logic in `packages/core/src/` as pure functions and unit-test it.

## Reporting bugs

Use the issue templates. For payment-related bugs, do not paste real phone numbers, PINs or transaction details.
