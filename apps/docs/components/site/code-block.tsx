import { CopyButton } from "@/components/site/copy-button"
import { highlight, type CodeLang } from "@/lib/highlight"

/**
 * A code block with a copy button. Highlighting happens on the server at build
 * time, so slow, low-end phones download colored HTML and no highlighter.
 */
export async function CodeBlock({
  code,
  label,
  lang,
}: {
  code: string
  label?: string
  lang?: CodeLang
}) {
  const html = await highlight(code, lang)

  return (
    <div className="bg-muted/50 relative rounded-lg border">
      <div className="absolute top-2 right-2 z-10">
        <CopyButton text={code} />
      </div>
      <div
        role="region"
        aria-label={label}
        className="[&_pre]:overflow-x-auto [&_pre]:p-4 [&_pre]:pr-24 [&_pre]:text-sm [&_pre]:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
