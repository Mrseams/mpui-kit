# Launch checklist

Everything between "the code works" and "people can install it, and the Vercel Open Source Program can find a healthy project". Written on 2026-09-21. Program details below were read from the live pages that day and may have changed: re-check them before you apply.

**Suggested order:** 1 Blockers → 2 GitHub → 3 Vercel → 4 Real install test → 5 shadcn directory → 6 npm package → 7 Vercel Open Source Program → 8 After launch.

---

## 1. Blockers: fix before you make the repo public

- [x] ~~Verify the Cameroon data against the ART numbering plan.~~ **Done on 2026-09-28:** the maintainer confirmed the MTN, Orange, Nexttel and Camtel prefix ranges against the ART allocation, and added `685` to Nexttel. (`registry/mpui-kit/lib/countries/cm.ts`)
- [ ] **Verify the region and city lists** (spelling, completeness), still marked `// TODO: verify region and city lists` in the same file. Unlike the phone prefixes, these have not been checked against a source.
- [x] ~~Fill in the Code of Conduct contact.~~ **Done:** [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) now points to the maintainer's email.
- [x] ~~Decide the licence holder.~~ **Done:** [LICENSE](./LICENSE) and `packages/core/LICENSE` now say "mrseams".
- [ ] **Confirm the name "MPUI-KIT" is usable before anything is public.** Chosen on 2026-09-28. Checked that day: `mpui-kit` and `@mpui-kit/core` were unclaimed on npm (no existing unscoped package, unlike the previous name), and `Mrseams/mpui-kit` did not exist on GitHub. Still to check: the npm organisation `mpui-kit`, the domain, and a search for existing projects or trademarks called "MPUI-KIT".
- [ ] **Rename the local folder** `mboa-ui` to `mpui-kit`. Nothing in the code depends on the folder name.
- [x] ~~Pick the domain.~~ **Done:** `https://mpui-kit.vercel.app`, filled in everywhere below. It still needs to be created and deployed (step 3).
  - [ ] Set `NEXT_PUBLIC_SITE_URL` to it on Vercel (see step 3). It feeds the install commands on the site.
- [ ] **Record the README demo GIF** (there is a placeholder). A short clip of the booking demo, French to English, paying with Mobile Money.
- [x] ~~Have the wording reviewed.~~ **Done:** the French strings were reviewed by the maintainer.
- [x] ~~Verify the card and PayPal guide against the real services.~~ **Done on 2026-09-28:** the guide's demo now runs Stripe's real Payment Element and PayPal's real Buttons, in test/sandbox mode, using each provider's own public test credentials (Stripe's shared test key, PayPal's `sb` client id). Verified in a real browser: filling Stripe's test card and pressing Pay makes a real request to `api.stripe.com/v1/confirmation_tokens` and returns a genuine token (`ctoken_...`); selecting PayPal renders its real button and clicking it opens a real PayPal popup. Found and fixed one real bug this surfaced: a doc heading with `id="paypal"` was shadowing `window.paypal` (the SDK's own global) via the browser's named-access behavior, which silently broke the PayPal button. Still not verified: completing a full PayPal sandbox purchase (needs a sandbox buyer login this environment doesn't have) and which currencies each provider can charge in production.
- [ ] **Decide when card and PayPal stop being beta.** They are labelled "(beta)" in the docs, the README, the CHANGELOG and the registry titles. Search for `beta` and remove the label once you're happy to keep the panel API stable. Note that the demo's PayPal order is still created client-side, as a demo-only shortcut (see the guide) — that part shouldn't be presented as production-ready regardless.
- [ ] **Have the Vue and Svelte sketches tried** by someone who uses them (`app/docs/headless/page.tsx`, `packages/core/README.md`). They are marked as not run.
- [x] ~~Run `git log` and check the author and email on every commit.~~ **Done:** every commit is `Emmanuel Essam <mrseams@outlook.fr>`, the address already public in the Code of Conduct.

## 2. GitHub

- [x] ~~Create the repository and push (`main`).~~ **Done:** public at `github.com/Mrseams/mpui-kit`.
- [ ] **Fix CI: the account is locked on a billing issue.** Every run since 2026-09-21 fails at startup with "your account is locked due to a billing issue" (not a code or workflow problem). Resolve it under Settings → Billing on github.com, then re-run the latest workflow and confirm it goes green. It uses Node 22 and reads the pnpm version from `packageManager`, while local development used Node 24 — watch for a difference once it actually runs.
- [ ] Turn on **private vulnerability reporting** (Settings → Code security). [SECURITY.md](./SECURITY.md) tells people to use it.
- [x] ~~Turn on Discussions.~~ **Done.**
- [x] ~~Create the labels the templates use.~~ **Done:** `bug` and `enhancement` already existed; added `country-data`.
- [x] ~~Add a description and topics.~~ **Done:** description was already set; added the topics `shadcn`, `shadcn-ui`, `registry`, `mobile-money`, `fcfa`, `africa`, `cameroon`, `nextjs`, `react`, `tailwindcss`, `i18n`.
- [ ] Protect `main` (require CI to pass, require a pull request). Needs CI working first.
- [ ] Tag `v0.1.0` and create a GitHub release from the [CHANGELOG](./CHANGELOG.md), once step 4 passes. Change "Unreleased" to the date.
- [x] ~~Run `pnpm audit` and look at anything serious.~~ **Done on 2026-09-28:** one low-severity advisory, in `esbuild` (a dev-only transitive dependency of `vitest`/`vite`, arbitrary file read from its dev server on Windows). Nothing reaches the built site or an installed component. Re-run after dependency updates.

## 3. Vercel

- [x] ~~Import the repository and deploy.~~ **Done:** live at <https://mpui-kit.vercel.app>.
- [ ] Confirm `NEXT_PUBLIC_SITE_URL` is actually set on Vercel (Production and Preview), rather than falling back to the hardcoded default in `lib/site.ts`. Both currently point at the same URL, so this can't be told apart from the outside — check the Vercel project settings directly.
- [ ] Add a custom domain, if you want one instead of `mpui-kit.vercel.app`.
- [x] ~~Open `/r/registry.json`, `/r/momo-checkout.json` and `/r/country-cm.json` and check they return JSON, not a page.~~ **Done on 2026-09-28:** all three return `application/json`.
- [ ] Optional: add `Access-Control-Allow-Origin: *` for `/r/*` in `next.config.ts`, so browser-based tools can read the registry. The CLI does not need it.
- [x] ~~Open the site on the real URL: landing, demo, dark toggle, docs, playground.~~ **Done:** the landing page, `/docs`, and `/docs/guides/card-and-paypal` were opened and worked. Dark toggle and playground were not separately re-checked on the live URL.
- [ ] Run `pnpm size` against the production build and check the numbers still hold. (Checked against a local build only, not the deployed one.)

## 4. Real install test: the one check that could never finish

Every earlier attempt to install a component that depends on shadcn's own `input` or `button` failed, because the connection to `ui.shadcn.com` kept resetting. Now that the registry is deployed, this was finally run for real, from this environment, on 2026-09-28.

- [x] ~~Create a fresh Next.js app with Tailwind v4: `npx shadcn@latest init`.~~ **Done.** The CLI's interactive prompts changed since this was written (a component-library and a preset choice were added): `npx shadcn@latest init -y --base radix --preset nova`. `-y` alone no longer skips every prompt.
- [x] ~~Register the namespace.~~ **Done**, against the live URL.
- [x] ~~Install, one at a time, and confirm each builds.~~ **Done, all real:**
  - [x] `@mpui-kit/country-cm @mpui-kit/mpui-kit-provider`
  - [x] `@mpui-kit/currency`
  - [x] `@mpui-kit/phone-input` — **this is the one that always failed before.** It pulled shadcn's `input` correctly.
  - [x] `@mpui-kit/payment-method-picker`
  - [x] `@mpui-kit/ussd-prompt` — pulled shadcn's `button`.
  - [x] `@mpui-kit/momo-checkout` (everything). A page using it built and rendered correctly (screenshot taken), with no console errors.
- [x] ~~Check files landed in the right folders, and dependencies were added when needed.~~ **Done:** every file landed under `components/mpui-kit/`, `lib/mpui-kit/`, `hooks/mpui-kit/` as expected, and `lucide-react` was added. `zod` was not, but nothing installed in this run needed it (only `phone-schema` does, for the optional react-hook-form integration, and it was not installed here).
- [ ] Repeat once in a project that uses a **`src/`** folder. (Not done: this run used a root-level project.)
- [ ] Repeat once in a project that **already has a customised `button` and `input`**. Check the CLI asks before overwriting them, and that the components then use your versions.
- [ ] Paste the README quick start into the fresh app and make sure it works as written, word for word.
- [ ] Try a project **without** `tw-animate-css` and one on **React 18**, and decide what to say. Animations degrade to nothing without it. On React 18, components that take `ref` as a prop will not forward it. (This run had `tw-animate-css` and React 19, both installed automatically by `shadcn init`.)

## 5. Get listed in the shadcn registry directory

From <https://ui.shadcn.com/docs/registry/registry-index> (read 2026-09-21):

- [ ] Your registry must be **open source and publicly accessible**.
- [ ] It must follow the registry schema, with **a flat structure: `/registry.json` and the item files at one level, no nested folders**. Ours is served as `/r/registry.json` and `/r/<name>.json`. Confirm that fits the directory's URL format.
- [ ] The `files` array in the index **must not include `content`**. Checked on 2026-09-21: the built `registry.json` has none, and the per-item files do (they need it to install).
- [ ] Edit `apps/v4/registry/directory.json` in <https://github.com/shadcn-ui/ui>, run `pnpm validate:registries` there, and open a pull request.
- [ ] After it merges, the registry is published and **Registry Health** monitoring starts, so keep the URLs stable.

## 6. Publish `@mpui-kit/core` to npm

It is built and checked here (`pnpm core:build && pnpm core:check`: imports as ESM and CommonJS, no React inside, about 8.6 kB gzipped) but `packages/core/package.json` still says `"private": true`. The docs and READMEs say "not published yet".

- [ ] **Choose the package name and the scope.** `@mpui-kit/core` needs an npm organisation called `mpui-kit`. Check it is free at <https://www.npmjs.com/org/create> (unclaimed as of 2026-09-28, but that can change). If not, pick another scope and change the name in `packages/core/package.json`, the README, the docs and `public/examples/vanilla.html`. **This step needs your own npm account and cannot be done from here** (no npm session is available in this environment — `npm whoami` fails).
- [ ] Turn on two-factor authentication for your npm account, and use a granular access token for CI, never your password.
- [x] ~~Fill in `repository`, `homepage` and `bugs` in `packages/core/package.json`.~~ **Done**, now that the GitHub repo exists.
- [ ] Decide the version. The registry and the package share the source, so start both at `0.1.0` and say in the CHANGELOG which one changed.
- [x] ~~Run `npm pack --dry-run` and check the file list.~~ **Done on 2026-09-28:** exactly `dist/`, `README.md`, `LICENSE` and `package.json` — 85.6 kB packed, 10 files. Still not done: setting `"private": false` and actually publishing, both of which need your npm login.
- [ ] Install the packed file (`npm pack`) in an empty project and import it from both an ESM and a CommonJS file.
- [ ] Publish with provenance from CI (`npm publish --provenance --access public`), so the package links to the commit that built it.
- [ ] After it is live, update the "not published yet" wording in `README.md`, `packages/core/README.md`, `app/docs/headless/page.tsx` and the CHANGELOG.
- [ ] Decide how the registry copy and the npm copy stay in step, so a fix to one reaches the other.

## 7. Vercel Open Source Program

From <https://vercel.com/open-source-program> (read 2026-09-21). **The page said applications were currently closed**, and mentioned a Spring 2026 cohort, with no date for the next one. Check it again.

What it lists as criteria, and where the project stands:

| Criterion                                              | Status                                              |
| ------------------------------------------------------ | --------------------------------------------------- |
| Open source, actively developed and maintained         | Not yet public. Commit regularly and answer issues. |
| Hosted on, or intended to host on, Vercel              | Yes, once step 3 is done.                           |
| Shows measurable impact or growth potential            | **The weak spot.** See below.                       |
| Follows a Code of Conduct                              | Added, with a real contact address (step 1).        |
| Credits used only for open source work and the project | Your commitment.                                    |

Benefits listed: $3,600 of Vercel credits over 3 years, a starter pack with credits from third-party services, and community support.

The page does not say how to apply or what the form asks, so **do not prepare answers in advance.** Look at the form when it opens.

**Build the "impact" evidence before you apply**, since a brand-new repo has little:

- [ ] A live demo people can try without installing anything (done: the landing page).
- [ ] The project listed in the shadcn directory (step 5).
- [ ] One real project using it, even yours. A short write-up of what it replaced.
- [ ] A post in the communities where the audience is (French-speaking developer groups, shadcn discussions) that links the demo.
- [ ] A visible roadmap: the Phase 2 items are already in the README ("Planned").
- [ ] Contributors: a good-first-issue or two, and at least one person other than you who has added a country.

## 8. After launch

- [ ] Watch issues and discussions daily for the first two weeks. Fast, friendly replies matter more than anything else for a small project.
- [ ] Keep `pnpm registry:check` and `pnpm size` in CI so the registry and the page weight cannot drift.
- [ ] Decide on Phase 2 in order of demand: OTP input, landmark-based address input, FCFA range slider, French date picker, and the rest of the planned list.
- [ ] Consider more payment panels as documented examples once they are tested against the real services (for example Mobile Money aggregators that host their own widget).

---

### Known limits worth telling users

- Cameroon's operator prefixes were verified against the ART numbering plan (2026-09-28); the region and city names are still unverified community data. Operator detection is a hint, not proof: never route money by it, since numbers can still be reassigned.
- The components are UI only. They never call a payment API, so your backend must confirm every payment before you deliver anything.
- Requires Tailwind CSS v4, shadcn/ui and React 19.
- The components never collect card numbers. A payment method's panel hosts your provider's own fields, and only a token reaches your code. See [SECURITY.md](./SECURITY.md).
- The card and PayPal examples are sketches, not tested against those services.
