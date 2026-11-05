import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const root = fileURLToPath(new URL(".", import.meta.url))
const packages = fileURLToPath(new URL("../../packages/", import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirrors the paths in tsconfig.json. Order matters: specific aliases first.
    alias: [
      { find: /^@\/lib\/mpui-kit\//, replacement: `${packages}core/src/` },
      { find: /^@\/components\/mpui-kit\//, replacement: `${packages}ui/src/components/` },
      { find: /^@\/hooks\/mpui-kit\//, replacement: `${packages}ui/src/hooks/` },
      { find: /^@\/components\/ui\//, replacement: `${packages}ui/src/shadcn/` },
      { find: /^@\/lib\/utils$/, replacement: `${packages}ui/src/shadcn/utils` },
      { find: /^@\//, replacement: root },
    ],
  },
  test: {
    include: ["lib/**/*.test.{ts,tsx}", "components/**/*.test.{ts,tsx}"],
    // Logic tests run in node. Component tests opt in to jsdom with a
    // `// @vitest-environment jsdom` comment at the top of the file.
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
  },
})
