import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const root = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Registry files import each other as they will be installed in a user's
    // project (`@/lib/mboa/...`). Here they live under `registry/mboa/`, so map
    // those paths back. Order matters: the specific aliases must come first.
    alias: [
      { find: /^@\/lib\/mboa\//, replacement: `${root}registry/mboa/lib/` },
      { find: /^@\/components\/mboa\//, replacement: `${root}registry/mboa/components/` },
      { find: /^@\//, replacement: root },
    ],
  },
  test: {
    include: [
      "registry/**/*.test.{ts,tsx}",
      "lib/**/*.test.{ts,tsx}",
      "components/**/*.test.{ts,tsx}",
    ],
    // Logic tests run in node. Component tests opt in to jsdom with a
    // `// @vitest-environment jsdom` comment at the top of the file.
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
  },
})
