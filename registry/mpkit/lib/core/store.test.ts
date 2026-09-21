import { describe, expect, it, vi } from "vitest"

import { createStore } from "@/lib/mpkit/core/store"

describe("createStore", () => {
  it("returns the initial state", () => {
    const store = createStore({ count: 0 })
    expect(store.getState()).toEqual({ count: 0 })
  })

  it("returns the same object until the state changes, as useSyncExternalStore requires", () => {
    const store = createStore({ count: 0 })
    expect(store.getState()).toBe(store.getState())

    const before = store.getState()
    store.setState({ count: 1 })
    expect(store.getState()).not.toBe(before)
    expect(store.getState()).toBe(store.getState())
  })

  it("tells listeners when the state changes", () => {
    const store = createStore(0)
    const listener = vi.fn()
    store.subscribe(listener)

    store.setState(1)
    store.setState(2)
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it("does not notify when the same object is set again", () => {
    const state = { count: 0 }
    const store = createStore(state)
    const listener = vi.fn()
    store.subscribe(listener)

    store.setState(state)
    expect(listener).not.toHaveBeenCalled()
  })

  it("stops notifying after unsubscribe", () => {
    const store = createStore(0)
    const listener = vi.fn()
    const stop = store.subscribe(listener)

    store.setState(1)
    stop()
    store.setState(2)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it("lets every listener see the new state", () => {
    const store = createStore(0)
    const seen: number[] = []
    store.subscribe(() => seen.push(store.getState()))
    store.subscribe(() => seen.push(store.getState() * 10))

    store.setState(3)
    expect(seen).toEqual([3, 30])
  })

  it("still calls the other listeners when one unsubscribes while being notified", () => {
    const store = createStore(0)
    const second = vi.fn()
    let stopFirst = () => {}
    stopFirst = store.subscribe(() => stopFirst())
    store.subscribe(second)

    store.setState(1)
    expect(second).toHaveBeenCalledTimes(1)
  })

  it("is safe to unsubscribe twice", () => {
    const store = createStore(0)
    const stop = store.subscribe(() => {})
    stop()
    expect(() => stop()).not.toThrow()
  })

  it("keeps separate stores independent", () => {
    const a = createStore(0)
    const b = createStore(0)
    const listener = vi.fn()
    b.subscribe(listener)
    a.setState(1)
    expect(listener).not.toHaveBeenCalled()
  })
})
