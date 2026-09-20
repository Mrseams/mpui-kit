import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

// Testing Library only advances fake timers when it detects Jest. Without this,
// `await user.click(...)` hangs in any test that calls `vi.useFakeTimers()`.
Object.assign(globalThis, {
  jest: { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) },
})

// Unmount rendered components between tests. A no-op in node-environment tests.
afterEach(() => {
  cleanup()
})
