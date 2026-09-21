import type { Metadata } from "next"
import Link from "next/link"

import { componentDocs, componentHref, guideDocs } from "@/lib/docs"

export const metadata: Metadata = { title: "Introduction" }

export default function DocsIndex() {
  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Introduction</h1>
        <p className="text-muted-foreground max-w-prose">
          MP Kit is a shadcn/ui registry for African markets. You copy components into your project,
          like the rest of shadcn/ui, and own the code.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Principles</h2>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5">
          <li>No hardcoded country. Country data is pluggable, with Cameroon first.</li>
          <li>UI only. Payment flows take async callbacks, so they work with any backend.</li>
          <li>Accessible by default, and bilingual FR/EN.</li>
          <li>Light. Built for slow connections and low-end phones.</li>
          <li>
            Themeable. They read your shadcn tokens, so they follow your theme and dark mode. See{" "}
            <Link href="/docs/theming" className="underline underline-offset-4">
              Theming
            </Link>
            .
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Guides</h2>
        <ul className="divide-y rounded-lg border">
          {guideDocs.map((guide) => (
            <li key={guide.href} className="p-4">
              <Link href={guide.href} className="font-medium hover:underline">
                {guide.title}
              </Link>
              <p className="text-muted-foreground text-sm">{guide.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Components</h2>
        <ul className="divide-y rounded-lg border">
          {componentDocs.map((doc) => (
            <li key={doc.slug} className="flex items-start justify-between gap-4 p-4">
              <div>
                {doc.status === "ready" ? (
                  <Link href={componentHref(doc.slug)} className="font-medium hover:underline">
                    {doc.title}
                  </Link>
                ) : (
                  <span className="font-medium">{doc.title}</span>
                )}
                <p className="text-muted-foreground text-sm">{doc.description}</p>
              </div>
              {doc.status === "soon" && (
                <span className="bg-muted rounded px-2 py-0.5 text-xs uppercase">Soon</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-muted-foreground text-sm">
        MP Kit is an independent project, not affiliated with any mobile network operator or mobile
        money provider.
      </p>
    </article>
  )
}
