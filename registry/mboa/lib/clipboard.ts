/**
 * Copies text to the clipboard. Uses the async Clipboard API when it is
 * available, and falls back to a hidden textarea and `execCommand("copy")`,
 * which older Android WebViews and non-secure (http) pages still need.
 * Resolves to whether the copy worked. Never throws.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return legacyCopy(text)
  }
}

function legacyCopy(text: string): boolean {
  if (typeof document === "undefined") return false
  const area = document.createElement("textarea")
  area.value = text
  area.setAttribute("readonly", "")
  area.style.position = "fixed"
  area.style.opacity = "0"
  document.body.appendChild(area)
  area.select()
  try {
    return document.execCommand("copy")
  } catch {
    return false
  } finally {
    document.body.removeChild(area)
  }
}
