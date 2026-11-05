/**
 * Light and dark mode for the docs site.
 *
 * The site follows the operating system until the visitor picks a theme with
 * the toggle. The choice is stored and wins from then on. Dark mode is the
 * `dark` class on <html>, which is what shadcn's tokens key off.
 */
export type Theme = "light" | "dark"

export const THEME_STORAGE_KEY = "theme"

/** The theme to use, given what was stored (if anything) and the system setting. */
export function resolveTheme(stored: string | null, systemPrefersDark: boolean): Theme {
  if (stored === "light" || stored === "dark") return stored
  return systemPrefersDark ? "dark" : "light"
}

/**
 * Runs in <head> before the page paints, so a visitor in dark mode never sees a
 * white flash. It must stay in step with `resolveTheme` (a test checks it), and
 * it swallows storage errors because storage can be blocked.
 */
export const themeInitScript = `(function(){try{var s=null;try{s=localStorage.getItem("${THEME_STORAGE_KEY}")}catch(e){}var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`

export function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === "light" || value === "dark" ? value : null
  } catch {
    return null // storage can be blocked or unavailable
  }
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // The choice still applies to this visit, it just will not be remembered.
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

export function isDark(): boolean {
  return document.documentElement.classList.contains("dark")
}
