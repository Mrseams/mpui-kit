import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// Unmount rendered components between tests. A no-op in node-environment tests.
afterEach(() => {
  cleanup()
})
