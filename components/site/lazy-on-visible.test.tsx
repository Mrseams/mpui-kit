// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { LazyOnVisible } from "@/components/site/lazy-on-visible"

type Callback = (entries: Array<{ isIntersecting: boolean }>) => void

let instances: FakeObserver[] = []

class FakeObserver {
  disconnected = false
  observed: Element[] = []
  constructor(
    private callback: Callback,
    public options?: IntersectionObserverInit
  ) {
    instances.push(this)
  }
  observe(element: Element) {
    this.observed.push(element)
  }
  disconnect() {
    this.disconnected = true
  }
  trigger(isIntersecting: boolean) {
    act(() => this.callback([{ isIntersecting }]))
  }
}

beforeEach(() => {
  instances = []
  vi.stubGlobal("IntersectionObserver", FakeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

const setup = (rootMargin?: string) =>
  render(
    <LazyOnVisible placeholder={<p>placeholder</p>} rootMargin={rootMargin}>
      <p>heavy content</p>
    </LazyOnVisible>
  )

describe("<LazyOnVisible />", () => {
  it("shows the placeholder and not the content at first", () => {
    setup()
    expect(screen.getByText("placeholder")).toBeInTheDocument()
    expect(screen.queryByText("heavy content")).toBeNull()
  })

  it("watches its own box", () => {
    const { container } = setup()
    expect(instances).toHaveLength(1)
    expect(instances[0].observed).toEqual([container.firstElementChild])
  })

  it("starts loading a bit before the box scrolls into view", () => {
    setup()
    expect(instances[0].options?.rootMargin).toBe("300px")
  })

  it("accepts a different margin", () => {
    setup("0px")
    expect(instances[0].options?.rootMargin).toBe("0px")
  })

  it("stays on the placeholder while the box is out of view", () => {
    setup()
    instances[0].trigger(false)
    expect(screen.getByText("placeholder")).toBeInTheDocument()
    expect(screen.queryByText("heavy content")).toBeNull()
  })

  it("shows the content once the box is near the viewport, and stops watching", () => {
    setup()
    instances[0].trigger(true)
    expect(screen.getByText("heavy content")).toBeInTheDocument()
    expect(screen.queryByText("placeholder")).toBeNull()
    expect(instances[0].disconnected).toBe(true)
  })

  it("keeps the content once shown, even if it scrolls away", () => {
    setup()
    instances[0].trigger(true)
    expect(instances).toHaveLength(1)
    expect(screen.getByText("heavy content")).toBeInTheDocument()
  })

  it("stops watching when it is unmounted early", () => {
    const { unmount } = setup()
    unmount()
    expect(instances[0].disconnected).toBe(true)
  })

  it("just loads the content in a browser without IntersectionObserver", async () => {
    vi.useFakeTimers()
    vi.stubGlobal("IntersectionObserver", undefined)
    setup()
    expect(screen.queryByText("heavy content")).toBeNull()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(screen.getByText("heavy content")).toBeInTheDocument()
  })
})
