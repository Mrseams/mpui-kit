import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <p className="text-muted-foreground text-sm">Pre-release · 0.1.0 in development</p>
      <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        shadcn/ui components for African markets
      </h1>
      <p className="text-muted-foreground max-w-prose text-lg text-pretty">
        Mobile Money checkout, FCFA currency, local phone numbers with operator detection, and
        bilingual FR/EN forms. Copy-paste components that work on slow connections and low-end
        phones. Cameroon first; other countries are a pull request away.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/docs/getting-started" className={buttonVariants({ size: "lg" })}>
          Get started
        </Link>
        <Link href="/playground" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Playground
        </Link>
      </div>
    </main>
  )
}
