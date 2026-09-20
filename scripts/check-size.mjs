#!/usr/bin/env node
/**
 * Checks how much JavaScript each page loads up front, after `next build`.
 *
 * The site is meant to work on low-end phones and slow connections, so this
 * guards two things:
 *  - a budget (gzipped kB) per page, and
 *  - the landing page demo staying lazy: the checkout code must not be in the
 *    JavaScript the landing page loads up front.
 *
 * It reads the prerendered HTML in .next/server/app, so it needs no server.
 * Set SIZE_BUDGET_SCALE (for example 0.5) to tighten every budget, which is
 * handy for checking that the script really fails.
 *
 * Usage: node scripts/check-size.mjs
 */
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { gzipSync } from "node:zlib"

const BUILD_DIR = ".next"
const scale = Number(process.env.SIZE_BUDGET_SCALE ?? 1)

// Budgets in gzipped kB. Measured on 2026-09-21 (Next 16, React 19) and rounded
// up by about 10%. About 125 kB of each is the framework itself.
const pages = [
  { path: "/", budgetKb: 210, mustStayLazy: ["checkout.selectMethod", "Studio meubl"] },
  { path: "/docs", budgetKb: 210 },
  { path: "/docs/getting-started", budgetKb: 210 },
  { path: "/docs/components/momo-checkout", budgetKb: 222 },
  { path: "/playground", budgetKb: 222 },
]

const htmlFile = (path) =>
  join(BUILD_DIR, "server", "app", path === "/" ? "index.html" : `${path.slice(1)}.html`)

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`

if (!existsSync(join(BUILD_DIR, "server", "app"))) {
  console.error("No build found. Run `pnpm build` first.")
  process.exit(1)
}

let failures = 0

for (const { path, budgetKb, mustStayLazy = [] } of pages) {
  const file = htmlFile(path)
  if (!existsSync(file)) {
    console.error(`error: ${path}: no prerendered page at ${file}`)
    failures++
    continue
  }

  const html = readFileSync(file, "utf8")
  const scripts = [...html.matchAll(/(?:src|href)="\/_next\/static\/([^"]+\.js)"/g)].map(
    (m) => m[1]
  )
  const initial = [...new Set(scripts)]

  let gzipped = 0
  const sources = []
  for (const script of initial) {
    const source = readFileSync(join(BUILD_DIR, "static", script), "utf8")
    gzipped += gzipSync(source).length
    sources.push([script, source])
  }

  const budget = budgetKb * scale
  const over = gzipped / 1024 > budget
  console.log(
    `${over ? "FAIL" : "ok  "} ${path.padEnd(34)} ${kb(gzipped).padStart(9)} of ${budget.toFixed(0)} kB  (${initial.length} files)`
  )
  if (over) failures++

  for (const marker of mustStayLazy) {
    const eager = sources.find(([, source]) => source.includes(marker))
    if (eager) {
      console.error(
        `error: ${path}: "${marker}" is in ${eager[0]}, which loads up front; it must stay lazy`
      )
      failures++
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} problem(s)`)
  process.exit(1)
}
console.log("\nbundle size ok")
