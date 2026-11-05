import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const root = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirrors the paths in tsconfig.json. Order matters: specific aliases first.
    alias: [
      { find: /^@\/lib\/mpui-kit\//, replacement: `${root}../core/src/` },
      { find: /^@\/components\/mpui-kit\//, replacement: `${root}src/components/` },
      { find: /^@\/hooks\/mpui-kit\//, replacement: `${root}src/hooks/` },
      { find: /^@\/components\/ui\//, replacement: `${root}src/shadcn/` },
      { find: /^@\/lib\/utils$/, replacement: `${root}src/shadcn/utils` },
    ],
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    // Logic tests run in node. Component tests opt in to jsdom with a
    // `// @vitest-environment jsdom` comment at the top of the file.
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
  },
})
