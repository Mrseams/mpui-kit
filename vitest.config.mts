import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const root = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Registry files import each other as they will be installed in a user's
    // project (`@/lib/mpkit/...`). Here they live under `registry/mpkit/`, so map
    // those paths back. Order matters: the specific aliases must come first.
    alias: [
      { find: /^@\/lib\/mpkit\//, replacement: `${root}registry/mpkit/lib/` },
      { find: /^@\/components\/mpkit\//, replacement: `${root}registry/mpkit/components/` },
      { find: /^@\/hooks\/mpkit\//, replacement: `${root}registry/mpkit/hooks/` },
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
