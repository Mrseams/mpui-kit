import Link from "next/link"

import { componentDocs, componentHref } from "@/lib/docs"

export function DocsSidebar() {
  return (
    <nav aria-label="Documentation" className="text-sm">
      <p className="text-muted-foreground mb-2 px-2 text-xs font-medium tracking-wide uppercase">
        Start
      </p>
      <ul className="mb-6 space-y-1">
        <li>
          <Link href="/docs" className="hover:bg-muted block rounded-md px-2 py-1.5">
            Introduction
          </Link>
        </li>
        <li>
          <Link
            href="/docs/getting-started"
            className="hover:bg-muted block rounded-md px-2 py-1.5"
          >
            Getting started
          </Link>
        </li>
      </ul>

      <p className="text-muted-foreground mb-2 px-2 text-xs font-medium tracking-wide uppercase">
        Components
      </p>
      <ul className="space-y-1">
        {componentDocs.map((doc) => (
          <li key={doc.slug}>
            {doc.status === "ready" ? (
              <Link
                href={componentHref(doc.slug)}
                className="hover:bg-muted block rounded-md px-2 py-1.5"
              >
                {doc.title}
              </Link>
            ) : (
              <span className="text-muted-foreground flex items-center justify-between rounded-md px-2 py-1.5">
                {doc.title}
                <span className="bg-muted rounded px-1.5 py-0.5 text-[10px] uppercase">Soon</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
