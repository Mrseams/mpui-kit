// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"

import { copyToClipboard } from "@/lib/mboa/clipboard"

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function stubClipboard(writeText: (text: string) => Promise<void>) {
  vi.stubGlobal("navigator", { clipboard: { writeText } })
}

describe("copyToClipboard", () => {
  it("uses the Clipboard API when it works", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboard(writeText)
    await expect(copyToClipboard("*126#")).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith("*126#")
  })

  it("falls back to execCommand when the Clipboard API rejects", async () => {
    stubClipboard(() => Promise.reject(new Error("denied")))
    const execCommand = vi.fn().mockReturnValue(true)
    Object.defineProperty(document, "execCommand", { value: execCommand, configurable: true })

    await expect(copyToClipboard("*126#")).resolves.toBe(true)
    expect(execCommand).toHaveBeenCalledWith("copy")
    // The temporary textarea is always cleaned up.
    expect(document.querySelector("textarea")).toBeNull()
  })

  it("falls back to execCommand when the Clipboard API is missing", async () => {
    vi.stubGlobal("navigator", {})
    const execCommand = vi.fn().mockReturnValue(true)
    Object.defineProperty(document, "execCommand", { value: execCommand, configurable: true })
    await expect(copyToClipboard("abc")).resolves.toBe(true)
  })

  it("resolves false, without throwing, when nothing works", async () => {
    stubClipboard(() => Promise.reject(new Error("denied")))
    Object.defineProperty(document, "execCommand", {
      value: () => {
        throw new Error("unsupported")
      },
      configurable: true,
    })
    await expect(copyToClipboard("abc")).resolves.toBe(false)
    expect(document.querySelector("textarea")).toBeNull()
  })

  it("resolves false when the browser reports the copy failed", async () => {
    stubClipboard(() => Promise.reject(new Error("denied")))
    Object.defineProperty(document, "execCommand", { value: () => false, configurable: true })
    await expect(copyToClipboard("abc")).resolves.toBe(false)
  })
})
