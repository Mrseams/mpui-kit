import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The Next.js app lives in apps/docs, not at the repo root.
  { settings: { next: { rootDir: "apps/docs/" } } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    "**/.next/**",
    "out/**",
    "build/**",
    "**/next-env.d.ts",
    "**/.turbo/**",
    // Build output.
    "packages/core/dist/**",
    "apps/docs/public/examples/mpui-kit-core.js",
  ]),
])

export default eslintConfig
