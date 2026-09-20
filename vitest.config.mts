import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    include: ["registry/**/*.test.{ts,tsx}", "lib/**/*.test.{ts,tsx}", "components/**/*.test.{ts,tsx}"],
    // Logic tests run in node. Component tests opt in to jsdom with a
    // `// @vitest-environment jsdom` comment at the top of the file.
    environment: "node",
  },
})
