# Launch checklist

Everything between "the code works" and "people can install it, and the Vercel Open Source Program can find a healthy project". Written on 2026-09-21. Program details below were read from the live pages that day and may have changed: re-check them before you apply.

**Suggested order:** 1 Blockers → 2 GitHub → 3 Vercel → 4 Real install test → 5 shadcn directory → 6 npm package → 7 Vercel Open Source Program → 8 After launch.

---

## 1. Blockers: fix before you make the repo public

- [ ] **Verify the Cameroon data against the ART numbering plan.** MTN, Orange and Camtel ranges came from you and are marked `TODO: verify`. **Nexttel `66` came from memory** and was never in your lists. The region and city lists are also from memory. Replace each `TODO` with a source and date once checked. (`registry/mpkit/lib/countries/cm.ts`)
- [ ] **Fill in the Code of Conduct contact.** [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) line 40 still says `[INSERT CONTACT METHOD]`. Use an address you are happy to publish. The Vercel program requires a Code of Conduct.
- [ ] **Decide the licence holder.** [LICENSE](./LICENSE) says "MP Kit contributors". Change it if you want your name or organisation there.
- [ ] **Confirm the name "MP Kit" is usable before anything is public.** It was chosen on 2026-09-21, and checked only against the npm registry that day: `mp-kit` and `@mpkit/core` were unclaimed, but an unrelated unscoped package called `mpkit` already exists, and the ownership of the `@mpkit` scope could not be checked from here. Still to check: the npm organisation `mpkit`, the GitHub name, the domain, and a search for existing projects or trademarks called "MP Kit" (the name is short and generic). If it changes, the rename is mechanical: see the commit that introduced it.
- [ ] **Rename the local folder** `mboa-ui` to `mp-kit`. Nothing in the code depends on the folder name.
- [ ] **Pick the domain**, then replace every placeholder:
  - [ ] `homepage` in `registry.json` (currently `https://mp-kit.vercel.app`, a guess)
  - [ ] `NEXT_PUBLIC_SITE_URL` (env var, see step 3). It feeds the install commands on the site.
  - [ ] `<your-docs-domain>` in `README.md`
  - [ ] `OWNER` in `.github/ISSUE_TEMPLATE/config.yml`
- [ ] **Record the README demo GIF** (there is a placeholder). A short clip of the booking demo, French to English, paying with Mobile Money.
- [ ] **Have the wording reviewed.** The copy was drafted with AI assistance. The French strings in particular deserve a native speaker's review (`registry/mpkit/lib/i18n.ts`, `lib/booking.ts`).
- [ ] **Verify the card and PayPal guide against the real services.** The Stripe Elements and PayPal Buttons code in `app/docs/guides/card-and-paypal/page.tsx` is a sketch that was never run against either. Build a small working example with each, in test mode, fix the code on the page, and then remove the "not run" wording. Also check which currencies each provider can charge: the guide only says to check.
- [ ] **Decide when card and PayPal stop being beta.** They are labelled "(beta)" in the docs, the README, the CHANGELOG and the registry titles. Search for `beta` and remove the label once the panel API has been used with a real provider and you are happy to keep it stable.
- [ ] **Have the Vue and Svelte sketches tried** by someone who uses them (`app/docs/headless/page.tsx`, `packages/core/README.md`). They are marked as not run.
- [ ] **Run `git log` and check the author and email** on every commit are the ones you want public.

## 2. GitHub

- [ ] Create the repository and push (`main`). There is no remote yet.
- [ ] **Confirm CI is green on the first push.** It has never run on GitHub. It uses Node 22 and reads the pnpm version from `packageManager`, while local development used Node 24. Fix any difference.
- [ ] Turn on **private vulnerability reporting** (Settings → Code security). [SECURITY.md](./SECURITY.md) tells people to use it.
- [ ] Turn on **Discussions** (the issue template links to them).
- [ ] Create the labels the templates use: `bug`, `enhancement`, `country-data`.
- [ ] Add a description and topics, for example: `shadcn`, `shadcn-ui`, `registry`, `mobile-money`, `fcfa`, `africa`, `cameroon`, `nextjs`, `react`, `tailwindcss`, `i18n`.
- [ ] Protect `main` (require CI to pass, require a pull request).
- [ ] Tag `v0.1.0` and create a GitHub release from the [CHANGELOG](./CHANGELOG.md), once step 4 passes. Change "Unreleased" to the date.
- [ ] Run `pnpm audit` and look at anything serious.

## 3. Vercel

- [ ] Import the repository. Framework: Next.js. Build command: the default `pnpm build` (it runs the registry check, the registry build and the site build). Use Node 22.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the final URL (Production and Preview).
- [ ] Add the custom domain if you have one.
- [ ] After the first deploy, open these and check they return JSON, not a page:
  - [ ] `/r/registry.json`
  - [ ] `/r/momo-checkout.json`
  - [ ] `/r/country-cm.json`
- [ ] Optional: add `Access-Control-Allow-Origin: *` for `/r/*` in `next.config.ts`, so browser-based tools can read the registry. The CLI does not need it.
- [ ] Open the site on the real URL: landing, demo, dark toggle, docs, playground.
- [ ] Run `pnpm size` against the production build and check the numbers still hold.

## 4. Real install test: the one check that could never finish

Every earlier attempt to install a component that depends on shadcn's own `input` or `button` failed, because the connection to `ui.shadcn.com` kept resetting. The manifest was checked statically (`pnpm registry:check`) and the CLI was seen resolving `input` correctly, but a complete install has not been observed. Do this from a normal connection:

- [ ] Create a fresh Next.js app with Tailwind v4: `npx shadcn@latest init`.
- [ ] Register the namespace: `npx shadcn@latest registry add @mpkit=https://YOUR-DOMAIN/r/{name}.json`
- [ ] Install, one at a time, and confirm each builds (`pnpm build`):
  - [ ] `@mpkit/country-cm @mpkit/mpkit-provider`
  - [ ] `@mpkit/currency`
  - [ ] `@mpkit/phone-input` (this pulls shadcn's `input`)
  - [ ] `@mpkit/payment-method-picker`
  - [ ] `@mpkit/ussd-prompt`
  - [ ] `@mpkit/momo-checkout` (everything)
- [ ] Check files landed in `components/mpkit/`, `lib/mpkit/`, `hooks/mpkit/`, and that the `lucide-react` and `zod` dependencies were added when needed.
- [ ] Repeat once in a project that uses a **`src/`** folder.
- [ ] Repeat once in a project that **already has a customised `button` and `input`**. Check the CLI asks before overwriting them, and that the components then use your versions.
- [ ] Paste the README quick start into the fresh app and make sure it works as written.
- [ ] Try a project **without** `tw-animate-css` and one on **React 18**, and decide what to say. Animations degrade to nothing without it. On React 18, components that take `ref` as a prop will not forward it.

## 5. Get listed in the shadcn registry directory

From <https://ui.shadcn.com/docs/registry/registry-index> (read 2026-09-21):

- [ ] Your registry must be **open source and publicly accessible**.
- [ ] It must follow the registry schema, with **a flat structure: `/registry.json` and the item files at one level, no nested folders**. Ours is served as `/r/registry.json` and `/r/<name>.json`. Confirm that fits the directory's URL format.
- [ ] The `files` array in the index **must not include `content`**. Checked on 2026-09-21: the built `registry.json` has none, and the per-item files do (they need it to install).
- [ ] Edit `apps/v4/registry/directory.json` in <https://github.com/shadcn-ui/ui>, run `pnpm validate:registries` there, and open a pull request.
- [ ] After it merges, the registry is published and **Registry Health** monitoring starts, so keep the URLs stable.

## 6. Publish `@mpkit/core` to npm

It is built and checked here (`pnpm core:build && pnpm core:check`: imports as ESM and CommonJS, no React inside, about 8.6 kB gzipped) but `packages/core/package.json` still says `"private": true`. The docs and READMEs say "not published yet".

- [ ] **Choose the package name and the scope.** `@mpkit/core` needs an npm organisation called `mpkit`. Check it is free at <https://www.npmjs.com/org/create>. If not, pick another scope and change the name in `packages/core/package.json`, the README, the docs and `public/examples/vanilla.html`.
- [ ] Turn on two-factor authentication for your npm account, and use a granular access token for CI, never your password.
- [ ] Fill in `repository`, `homepage` and `bugs` in `packages/core/package.json` once the GitHub URL exists.
- [ ] Decide the version. The registry and the package share the source, so start both at `0.1.0` and say in the CHANGELOG which one changed.
- [ ] Set `"private": false`, then run `pnpm core:build && pnpm core:check` and `cd packages/core && npm pack --dry-run`. Read the file list: only `dist`, the README and the LICENSE should be in it.
- [ ] Install the packed file (`npm pack`) in an empty project and import it from both an ESM and a CommonJS file.
- [ ] Publish with provenance from CI (`npm publish --provenance --access public`), so the package links to the commit that built it.
- [ ] After it is live, update the "not published yet" wording in `README.md`, `packages/core/README.md`, `app/docs/headless/page.tsx` and the CHANGELOG.
- [ ] Decide how the registry copy and the npm copy stay in step, so a fix to one reaches the other.

## 7. Vercel Open Source Program

From <https://vercel.com/open-source-program> (read 2026-09-21). **The page said applications were currently closed**, and mentioned a Spring 2026 cohort, with no date for the next one. Check it again.

What it lists as criteria, and where the project stands:

| Criterion                                              | Status                                                     |
| ------------------------------------------------------ | ---------------------------------------------------------- |
| Open source, actively developed and maintained         | Not yet public. Commit regularly and answer issues.        |
| Hosted on, or intended to host on, Vercel              | Yes, once step 3 is done.                                  |
| Shows measurable impact or growth potential            | **The weak spot.** See below.                              |
| Follows a Code of Conduct                              | Added, but the contact placeholder is still open (step 1). |
| Credits used only for open source work and the project | Your commitment.                                           |

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

- Cameroon prefix and region data is community data, not an authoritative source. Operator detection is a hint. Never route money by it.
- The components are UI only. They never call a payment API, so your backend must confirm every payment before you deliver anything.
- Requires Tailwind CSS v4, shadcn/ui and React 19.
- The components never collect card numbers. A payment method's panel hosts your provider's own fields, and only a token reaches your code. See [SECURITY.md](./SECURITY.md).
- The card and PayPal examples are sketches, not tested against those services.
