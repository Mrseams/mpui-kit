"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import { applyTheme, isDark, readStoredTheme, resolveTheme, storeTheme } from "@/lib/theme"

// The theme lives in the <html> class, which the inline script sets before
// paint. Read it from there so the toggle can never disagree with the page.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  return () => observer.disconnect()
}

/** Switches between light and dark mode, and remembers the choice. */
export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false)

  // Until the visitor has chosen, follow the operating system as it changes.
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)")
    function onSystemChange() {
      if (readStoredTheme() === null) applyTheme(resolveTheme(null, query.matches))
    }
    query.addEventListener("change", onSystemChange)
    return () => query.removeEventListener("change", onSystemChange)
  }, [])

  function toggle() {
    const next = dark ? "light" : "dark"
    applyTheme(next)
    storeTheme(next)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Dark mode"
      aria-pressed={dark}
      title="Dark mode"
      onClick={toggle}
    >
      {/* Both icons are in the markup and CSS picks one, so there is no flash before hydration. */}
      <Moon className="dark:hidden" aria-hidden />
      <Sun className="hidden dark:block" aria-hidden />
    </Button>
  )
}
