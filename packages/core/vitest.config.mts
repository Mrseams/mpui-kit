import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

const root = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  resolve: {
    // Mirrors the paths in tsconfig.json.
    alias: [{ find: /^@\/lib\/mpui-kit\//, replacement: `${root}src/` }],
  },
  test: {
    include: ["src/**/*.test.ts"],
    // Logic tests run in node. A test that needs the DOM opts in with a
    // `// @vitest-environment jsdom` comment at the top of the file.
    environment: "node",
  },
})
