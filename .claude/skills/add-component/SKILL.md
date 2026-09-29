---
name: add-component
description: Add a new MPUI-KIT component (or hook or lib helper) end to end, following the repository's conventions — registry source file, tests, FR/EN strings, registry.json item, docs page with a live demo, docs nav entry, changelog and the full CI check. Use when the user asks to add, create, build or scaffold a component, block, hook or utility for the kit. Not for adding a country (CONTRIBUTING.md "Add your country" covers that).
---

# Add a component to MPUI-KIT

Follow `CONTRIBUTING.md` — this skill is the step-by-step version of it. Read one existing
component of similar shape before writing anything and copy its patterns; `ussd-prompt` is the
reference for a component, `use-countdown` for a hook, `format-fcfa` for a lib helper.

Throughout, `<name>` is the kebab-case registry name (for example `ussd-prompt`) and `<Name>` the
PascalCase export (`UssdPrompt`).

## 1. Put the logic in `registry/mpui-kit/lib/` first

Anything that is not rendering — formatting, parsing, state transitions, timing — goes in
`registry/mpui-kit/lib/<helper>.ts` as pure functions with a `<helper>.test.ts` next to it. If it
is stateful and framework-free, it belongs in `registry/mpui-kit/lib/core/` as a controller with
`getSnapshot()` and `subscribe()` (see `countdown-controller.ts`), with a thin React hook in
`registry/mpui-kit/hooks/`. Anything added to `lib/core/` that users of `@mpui-kit/core` should
get must also be exported from `registry/mpui-kit/lib/core/index.ts`.

## 2. Write the component: `registry/mpui-kit/components/<name>.tsx`

- **Imports use installed paths**, never `@/registry/...` and never relative paths:
  `@/lib/mpui-kit/...`, `@/components/mpui-kit/...`, `@/hooks/mpui-kit/...`,
  `@/components/ui/<primitive>`, `@/lib/utils` (for `cn`).
- `"use client"` at the top when it uses state, effects or event handlers.
- **Never hardcode a country.** Take an optional `country?: CountryConfig` prop and fall back to
  `MpuiKitProvider` (`useMpuiKit()`); same for `locale?: Locale` via `useT(locale)`.
- **UI only.** No payment API calls; accept async callbacks (`onPay`, `onRetry`, ...).
- **Props**: `export interface <Name>Props extends Omit<ComponentProps<"<root element>">, ...>`,
  spread `...props` on the root, merge `className` with `cn()`. Every prop gets a JSDoc comment.
- **Styling hooks**: larger components export a `<Name>ClassNames` interface (one documented key
  per part), take `classNames?: <Name>ClassNames`, and put `data-slot="<name>"` on the root and
  `data-slot="<name>-<part>"` on each part.
- **Accessible**: real labels, keyboard support, `aria-live="polite"` for async/changing state,
  decorative icons `aria-hidden="true"`.
- **Motion** only through Tailwind `motion-safe:` / `motion-reduce:` variants (tw-animate-css);
  no animation libraries or heavy dependencies — the audience is on slow connections.
- **No logos or brand assets**; operators are a name plus a neutral color.

## 3. Strings: `registry/mpui-kit/lib/i18n.ts`

Every user-facing string is a key in the `en` object, namespaced by component
(`"ussd.title"`, `"picker.card"`), with the matching entry in `fr`, using the same `{placeholder}`
names in both. Write natural French, not a word-for-word translation. `i18n.test.ts` fails if a key, a placeholder or a translation is missing.

## 4. Test: `registry/mpui-kit/components/<name>.test.tsx`

Match the existing tests:

- First line `// @vitest-environment jsdom`.
- `@testing-library/react` + `userEvent.setup({ delay: null })`, `vitest` globals imported
  explicitly.
- Render inside `<MpuiKitProvider country={cm} locale={locale}>` via a `setup()` helper.
- Query by role and accessible name; cover content, interactions, both `en` and `fr`, and any
  timer behavior with `vi.useFakeTimers()` + `act(() => vi.advanceTimersByTime(ms))`.

## 5. Register it in `registry.json`

Add an item after the items it depends on:

```json
{
  "name": "<name>",
  "type": "registry:component",
  "title": "<Name>",
  "description": "One or two plain sentences on what it does for the user.",
  "dependencies": ["lucide-react"],
  "registryDependencies": ["button", "@mpui-kit/mpui-kit-provider", "@mpui-kit/country-types"],
  "files": [
    {
      "path": "registry/mpui-kit/components/<name>.tsx",
      "type": "registry:component",
      "target": "components/mpui-kit/<name>.tsx"
    }
  ]
}
```

- `type`: `registry:component`, `registry:block` (full flows like `momo-checkout`),
  `registry:hook` (target `hooks/mpui-kit/...`) or `registry:lib` (target `lib/mpui-kit/...`).
- Each new lib/hook file gets **its own item**, so users install only what they use.
- `dependencies`: npm packages imported (not react/react-dom/next).
- `registryDependencies`: shadcn primitives by bare name (`"button"`, `"input"`) and every
  `@mpui-kit/<item>` whose file is imported.

Then run `pnpm registry:check` and fix every error it reports.

## 6. Docs

- **Demo** `app/docs/components/<name>/<name>-demo.tsx`: `"use client"`, wrapped in
  `<MpuiKitProvider country={cm} locale={locale}>` with a `<LocaleToggle>`, imports through the
  installed paths. Use made-up example data (no real phone numbers or codes presented as real).
- **Page** `app/docs/components/<name>/page.tsx`: `export const metadata: Metadata = { title }`, a
  `usage` code string, a `props: PropRow[]` table covering every prop (including `country`,
  `locale`, `classNames` listing its keys, and `...props`), rendered through `<ComponentDoc>`, with
  extra `<section aria-labelledby=...>` blocks for notes (accessibility, motion, state-only
  behavior). Follow `app/docs/components/ussd-prompt/page.tsx`.
- **Nav**: add a `DocEntry` to `componentDocs` in `lib/docs.ts` (slug = registry name,
  `status: "ready"`). The sidebar and `/docs` index read from it.

## 7. Changelog

Add a bullet to `CHANGELOG.md` under an `## [Unreleased]` section at the top (create it above
the latest release if it is missing), in the `### Added` group, written for users.

## 8. Verify — the same commands CI runs

```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm registry:check && pnpm build && pnpm size
```

If `pnpm size` fails, make the demo lighter or lazy before considering a budget change in
`scripts/check-size.mjs`. Report any command that fails, with its output; do not claim success
without running them.

## 9. Commit

Conventional Commits, scoped, in the repository's granularity (see `git log`):

1. `feat(<name>): add <helper>` — lib/hook logic and its tests, if any.
2. `feat(<name>): add <Name>` — the component, strings and tests.
3. `feat(docs): add the <Name> docs page and registry items` — registry.json, demo, page,
   `lib/docs.ts`, changelog.

Only commit when the user asks. The PR description follows `.github/PULL_REQUEST_TEMPLATE.md`
(What and why, then the checklist).
