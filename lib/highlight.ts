import { createHighlighter, type Highlighter } from "shiki"

export type CodeLang = "tsx" | "bash" | "json"

let highlighter: Promise<Highlighter> | undefined

/** Commands are bash, a lone object is JSON, everything else is TSX. */
export function guessLang(code: string): CodeLang {
  const start = code.trimStart()
  if (/^(npx|npm|pnpm|yarn|bun) /.test(start)) return "bash"
  if (start.startsWith("{")) return "json"
  return "tsx"
}

/**
 * Highlights code to HTML on the server, at build time. It ships no JavaScript
 * to the browser: the colors are CSS variables for the light and dark themes,
 * switched by the `.dark` class in globals.css.
 */
export async function highlight(code: string, lang: CodeLang = guessLang(code)): Promise<string> {
  highlighter ??= createHighlighter({
    themes: ["github-light", "github-dark"],
    langs: ["tsx", "bash", "json"],
  })
  return (await highlighter).codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  })
}
