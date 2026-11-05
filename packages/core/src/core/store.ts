/**
 * A tiny observable store. It is the whole "framework adapter" surface of the
 * core: `getState` and `subscribe` are exactly what React's `useSyncExternalStore`
 * wants, and what a Vue `shallowRef`, a Svelte store or a plain `render()` call
 * needs to stay in step.
 */
export type Listener = () => void

export interface Store<T> {
  /** The current state. The same object is returned until the state changes. */
  getState: () => T
  /** Replaces the state and tells every listener. Does nothing if it is the same object. */
  setState: (next: T) => void
  /** Calls `listener` after every change. Returns a function that stops listening. */
  subscribe: (listener: Listener) => () => void
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial
  const listeners = new Set<Listener>()

  return {
    getState: () => state,
    setState(next) {
      if (Object.is(next, state)) return
      state = next
      // Copy first, so a listener that unsubscribes while we loop cannot skip another one.
      for (const listener of [...listeners]) listener()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
