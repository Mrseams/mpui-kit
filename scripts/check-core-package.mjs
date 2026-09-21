#!/usr/bin/env node
/**
 * Checks the built npm package (`pnpm core:build` first): that it imports both
 * as ESM and as CommonJS, exports the same things either way, has no React or
 * Next.js in it, actually works, and stays small.
 *
 * Usage: node scripts/check-core-package.mjs
 */
import { existsSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { gzipSync } from "node:zlib"

const packageDir = resolve("packages/core")
const dist = join(packageDir, "dist")
const manifest = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"))
const GZIP_BUDGET_KB = 12

const problems = []
const check = (condition, message) => {
  if (!condition) problems.push(message)
}

if (!existsSync(join(dist, "index.js"))) {
  console.error("No build found. Run `pnpm core:build` first.")
  process.exit(1)
}

// 1. Every file the manifest points at exists.
const targets = [
  manifest.main,
  manifest.module,
  manifest.types,
  manifest.exports["."].import.types,
  manifest.exports["."].import.default,
  manifest.exports["."].require.types,
  manifest.exports["."].require.default,
]
for (const target of new Set(targets)) {
  check(
    existsSync(join(packageDir, target)),
    `package.json points at ${target}, which does not exist`
  )
}

// 2. It works as ESM and as CommonJS, with the same exports.
const esm = await import(pathToFileURL(join(dist, "index.js")).href)
const cjs = createRequire(import.meta.url)(join(dist, "index.cjs"))
const esmKeys = Object.keys(esm).sort()
const cjsKeys = Object.keys(cjs).sort()
check(
  JSON.stringify(esmKeys) === JSON.stringify(cjsKeys),
  `ESM and CommonJS export different things: ${esmKeys.filter((key) => !cjsKeys.includes(key))} / ${cjsKeys.filter((key) => !esmKeys.includes(key))}`
)

const expected = [
  "createCheckoutController",
  "createPhoneField",
  "createCountdown",
  "createStore",
  "createTranslator",
  "formatFcfa",
  "validatePhone",
  "detectOperator",
  "applyPhoneEdit",
  "checkoutReducer",
  "defaultPaymentMethods",
  "resolvePayment",
  "dialHref",
  "cm",
  "prefixRange",
]
for (const name of expected) {
  check(typeof esm[name] !== "undefined", `missing export: ${name}`)
}

// 3. No UI framework inside.
const bundles = ["index.js", "index.cjs"].map((file) => [
  file,
  readFileSync(join(dist, file), "utf8"),
])
for (const [file, source] of bundles) {
  for (const forbidden of [
    /from\s*["']react/,
    /require\(["']react/,
    /from\s*["']next/,
    /require\(["']next/,
  ]) {
    check(!forbidden.test(source), `${file} imports a UI framework (${forbidden})`)
  }
}

// 4. It does what it says, in plain Node.
check(esm.formatFcfa(25000) === "25 000 FCFA", "formatFcfa(25000) is wrong")
const phone = esm.validatePhone("6 51 23 45 67", esm.cm)
check(
  phone.valid && phone.e164 === "+237651234567",
  "validatePhone did not return the E.164 number"
)
check(esm.createTranslator("fr")("ussd.retry") === "Réessayer", "the French dictionary is wrong")

const field = esm.createPhoneField({ country: esm.cm })
check(
  field.input("651234567").formatted === "6 51 23 45 67",
  "createPhoneField did not group the digits"
)

const checkout = esm.createCheckoutController({
  amount: 25000,
  currency: "XAF",
  onPay: async () => ({ status: "success", reference: "SMOKE-1" }),
})
checkout.pay({ methodId: "cash" })
await new Promise((done) => setTimeout(done, 0))
const state = checkout.getSnapshot().state
check(
  state.status === "success" && state.receipt.reference === "SMOKE-1",
  "the checkout did not reach success"
)
checkout.destroy()

const countdown = esm.createCountdown({ expiresAt: Date.now() + 60_000 })
check(
  countdown.getSnapshot().remainingMs > 59_000,
  "createCountdown did not count from the deadline"
)
countdown.destroy()

// 5. It stays small.
const gzipKb = gzipSync(readFileSync(join(dist, "index.js"))).length / 1024
check(
  gzipKb <= GZIP_BUDGET_KB,
  `index.js is ${gzipKb.toFixed(1)} kB gzipped, over the ${GZIP_BUDGET_KB} kB budget`
)

if (problems.length > 0) {
  for (const problem of problems) console.error(`error: ${problem}`)
  console.error(`\n${problems.length} problem(s) in the core package`)
  process.exit(1)
}
console.log(
  `core package ok: ${esmKeys.length} exports, ESM and CommonJS agree, ${gzipKb.toFixed(1)} kB gzipped, no React or Next.js`
)
