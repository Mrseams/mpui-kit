import type { Metadata } from "next"

import { Playground } from "@/app/playground/playground"

export const metadata: Metadata = { title: "Playground" }

export default function PlaygroundPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-2 px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Playground</h1>
      <p className="text-muted-foreground max-w-prose">
        Try MP Kit as it is built. Components appear here as they land. For now you can exercise the
        logic behind them.
      </p>
      <Playground />
    </main>
  )
}
