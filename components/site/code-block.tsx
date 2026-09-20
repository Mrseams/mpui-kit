import { CopyButton } from "@/components/site/copy-button"

/**
 * A plain code block with a copy button. There is deliberately no syntax
 * highlighter: it keeps the JavaScript sent to slow, low-end phones to a minimum.
 */
export function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="bg-muted/50 relative rounded-lg border">
      <div className="absolute top-2 right-2">
        <CopyButton text={code} />
      </div>
      <pre
        className="overflow-x-auto p-4 pr-24 text-sm leading-relaxed"
        tabIndex={0}
        aria-label={label}
      >
        <code>{code}</code>
      </pre>
    </div>
  )
}
