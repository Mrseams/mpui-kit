"use client"

import { useId, useState, type ReactNode } from "react"

import { CopyButton } from "@/components/site/copy-button"
import { cn } from "@/lib/utils"

interface ShowcaseProps {
  title: string
  description: string
  /** Registry items the example needs, for the install command. */
  items: string[]
  /** File name shown above the source. */
  filename: string
  /** The example's source, exactly as it runs in the preview. */
  code: string
  /** The same source, highlighted on the server. */
  html: string
  children: ReactNode
}

/** A live example with a Preview / Code switch and copy buttons. */
export function Showcase({
  title,
  description,
  items,
  filename,
  code,
  html,
  children,
}: ShowcaseProps) {
  const [tab, setTab] = useState<"preview" | "code">("preview")
  const id = useId()
  const install = `npx shadcn@latest add ${items.map((item) => `@mpui-kit/${item}`).join(" ")}`

  return (
    <section aria-labelledby={`${id}-title`} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl space-y-1">
          <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight">
            {title}
          </h2>
          <p className="text-muted-foreground text-sm text-pretty">{description}</p>
        </div>
        <div role="tablist" aria-label={title} className="bg-muted flex rounded-lg p-1 text-sm">
          {(["preview", "code"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              id={`${id}-${value}-tab`}
              aria-selected={tab === value}
              aria-controls={`${id}-${value}`}
              onClick={() => setTab(value)}
              className={cn(
                "focus-visible:ring-ring/50 rounded-md px-3 py-1 font-medium outline-none focus-visible:ring-3",
                tab === value ? "bg-background shadow-sm" : "text-muted-foreground"
              )}
            >
              {value === "preview" ? "Preview" : "Code"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border">
        {/* Kept mounted while the code is shown, so the form keeps what was typed. */}
        <div
          role="tabpanel"
          id={`${id}-preview`}
          aria-labelledby={`${id}-preview-tab`}
          hidden={tab !== "preview"}
          className="bg-muted/40 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:16px_16px] px-4 py-10 sm:px-8 sm:py-14"
        >
          {children}
        </div>
        <div
          role="tabpanel"
          id={`${id}-code`}
          aria-labelledby={`${id}-code-tab`}
          hidden={tab !== "code"}
        >
          <div className="bg-muted/50 flex items-center justify-between gap-3 border-b px-4 py-2">
            <span className="text-muted-foreground font-mono text-xs">{filename}</span>
            <CopyButton text={code} label="Copy code" />
          </div>
          <div
            role="region"
            aria-label={`${title} source`}
            className="line-numbers bg-muted/20 [&_pre]:max-h-[32rem] [&_pre]:overflow-auto [&_pre]:py-4 [&_pre]:pr-4 [&_pre]:text-[13px] [&_pre]:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
        <div className="bg-muted/30 flex items-center gap-3 border-t px-4 py-2">
          <code className="text-muted-foreground min-w-0 flex-1 truncate font-mono text-xs">
            {install}
          </code>
          <CopyButton text={install} label="Copy install" />
        </div>
      </div>
    </section>
  )
}
