import { defineConfig } from "tsup"

// The package is built from the same source files the shadcn registry ships, so
// there is one copy of the code. tsconfig.json maps `@/lib/mpui-kit/*` to `src/*`,
// which esbuild and the type bundler follow.
export default defineConfig({
  entry: { index: "src/index.ts" },
  outDir: "dist",
  format: ["esm", "cjs"],
  // The package is "type": "module", so ESM is .js and CommonJS is .cjs.
  outExtension: ({ format }) => ({ js: format === "esm" ? ".js" : ".cjs" }),
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  target: "es2020",
  platform: "neutral",
  // The core has no runtime dependencies, so there is nothing to mark external.
})
