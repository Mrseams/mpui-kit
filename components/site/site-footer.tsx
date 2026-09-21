import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t">
      <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm">
        <p className="max-w-prose">
          MP Kit is an independent open-source project, MIT licensed. It is not affiliated with,
          endorsed by or sponsored by any mobile network operator, mobile money provider, bank or
          payment company. All trademarks belong to their owners.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/docs" className="hover:text-foreground">
            Docs
          </Link>
          <Link href="/docs/getting-started" className="hover:text-foreground">
            Getting started
          </Link>
          <Link href="/docs/theming" className="hover:text-foreground">
            Theming
          </Link>
          <Link href="/playground" className="hover:text-foreground">
            Playground
          </Link>
        </nav>
      </div>
    </footer>
  )
}
