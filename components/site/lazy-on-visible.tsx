"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

/**
 * Shows `placeholder` until the box is close to the viewport, and only then
 * renders `children`. Put a lazily loaded component inside, and its JavaScript
 * is not downloaded until the visitor scrolls near it: useful for heavy demos
 * on slow connections and low-end phones.
 */
export function LazyOnVisible({
  children,
  placeholder,
  rootMargin = "300px",
}: {
  children: ReactNode
  placeholder: ReactNode
  /** How far outside the viewport to start loading, so it is ready by the time it scrolls in. */
  rootMargin?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (visible) return

    // Very old browsers have no IntersectionObserver: just load it.
    if (typeof IntersectionObserver === "undefined") {
      const timer = setTimeout(() => setVisible(true), 0)
      return () => clearTimeout(timer)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [visible, rootMargin])

  return <div ref={ref}>{visible ? children : placeholder}</div>
}
