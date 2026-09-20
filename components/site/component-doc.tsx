import Link from "next/link"
import type { ReactNode } from "react"

import { CodeBlock } from "@/components/site/code-block"
import { PropsTable, type PropRow } from "@/components/site/props-table"

interface ComponentDocProps {
  /** Registry item name, used for the install command. */
  name: string
  title: string
  description: string
  /** Live, interactive preview. */
  preview: ReactNode
  /** Source of the usage example shown under the preview. */
  usage: string
  props: PropRow[]
  /** Extra sections, such as accessibility notes or form integration. */
  children?: ReactNode
}

export function ComponentDoc({
  name,
  title,
  description,
  preview,
  usage,
  props,
  children,
}: ComponentDocProps) {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground max-w-prose">{description}</p>
      </header>

      <section aria-labelledby="preview" className="space-y-3">
        <h2 id="preview" className="text-xl font-semibold">
          Preview
        </h2>
        <div className="rounded-lg border p-4 sm:p-6">{preview}</div>
      </section>

      <section aria-labelledby="installation" className="space-y-3">
        <h2 id="installation" className="text-xl font-semibold">
          Installation
        </h2>
        <CodeBlock label={`Install ${title}`} code={`npx shadcn@latest add @mboa/${name}`} />
        <p className="text-muted-foreground text-sm">
          Requires the <code>@mboa</code> namespace. See{" "}
          <Link href="/docs/getting-started" className="underline underline-offset-4">
            Getting started
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="usage" className="space-y-3">
        <h2 id="usage" className="text-xl font-semibold">
          Usage
        </h2>
        <CodeBlock label={`${title} usage`} code={usage} />
      </section>

      <section aria-labelledby="props" className="space-y-3">
        <h2 id="props" className="text-xl font-semibold">
          Props
        </h2>
        <PropsTable rows={props} />
      </section>

      {children}
    </article>
  )
}
