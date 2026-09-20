import Link from "next/link"

const links = [
  { href: "/docs", label: "Docs" },
  { href: "/playground", label: "Playground" },
]

export function SiteHeader() {
  return (
    <header className="bg-background/90 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-semibold tracking-tight">
          mboa-ui
        </Link>
        <nav aria-label="Main" className="flex items-center gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
