#!/usr/bin/env node
/**
 * Copies the built core package next to the plain-JavaScript example page, so
 * /examples/vanilla.html can import it. Run after `pnpm core:build`.
 */
import { copyFileSync, existsSync } from "node:fs"

const from = "packages/core/dist/index.js"
if (!existsSync(from)) {
  console.error("No core build found. Run `pnpm core:build` first.")
  process.exit(1)
}
copyFileSync(from, "public/examples/mpkit-core.js")
console.log("copied the core bundle to public/examples/mpkit-core.js")
