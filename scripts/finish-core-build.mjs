#!/usr/bin/env node
/**
 * Runs after tsup in `pnpm core:build`. The whole API is one declaration file, so
 * CommonJS users get a copy under the name they expect (index.d.cts). This is a
 * separate step because tsup builds declarations in a worker, and its own
 * `onSuccess` hook can run before they exist.
 */
import { copyFileSync, existsSync } from "node:fs"

const from = "packages/core/dist/index.d.ts"
if (!existsSync(from)) {
  console.error(`${from} was not built`)
  process.exit(1)
}
copyFileSync(from, "packages/core/dist/index.d.cts")
console.log("wrote packages/core/dist/index.d.cts")
