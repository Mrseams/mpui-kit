import { defineConfig } from "tsup"

// The package is built from the same source files the shadcn registry ships, so
// there is one copy of the code. Run from the repository root: tsconfig.json maps
// `@/lib/mpkit/*` to `registry/mpkit/lib/*`, which esbuild and the type bundler follow.
export default defineConfig({
  entry: { index: "registry/mpkit/lib/core/index.ts" },
  outDir: "packages/core/dist",
  format: ["esm", "cjs"],
  // The package is "type": "module", so ESM is .js and CommonJS is .cjs. (tsup
  // would otherwise decide from the repository root, which is not.)
  outExtension: ({ format }) => ({ js: format === "esm" ? ".js" : ".cjs" }),
  dts: {
    // The site's tsconfig turns on incremental builds, which the declaration build cannot use.
    compilerOptions: { incremental: false, composite: false, tsBuildInfoFile: undefined },
  },
  clean: true,
  sourcemap: true,
  treeshake: true,
  target: "es2020",
  platform: "neutral",
  // The core has no runtime dependencies, so there is nothing to mark external.
})
