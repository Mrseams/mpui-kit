import type { Metadata } from "next"
import Link from "next/link"

import { CodeBlock } from "@/components/site/code-block"
import { registryUrlTemplate } from "@/lib/site"

export const metadata: Metadata = { title: "Getting started" }

const providerExample = `import { MboaProvider } from "@/components/mboa/mboa-provider"
import { cm } from "@/lib/mboa/countries/cm"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <MboaProvider country={cm} locale="fr">
          {children}
        </MboaProvider>
      </body>
    </html>
  )
}`

export default function GettingStarted() {
  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Getting started</h1>
        <p className="text-muted-foreground max-w-prose">
          Add the registry to a project that already uses shadcn/ui, then install what you need.
        </p>
      </header>

      <section aria-labelledby="requirements" className="space-y-3">
        <h2 id="requirements" className="text-xl font-semibold">
          Requirements
        </h2>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5">
          <li>
            <strong>Tailwind CSS v4</strong>. The components are styled with Tailwind classes.
          </li>
          <li>
            <strong>shadcn/ui</strong>, set up with CSS variables (
            <code>npx shadcn@latest init</code>
            ), so the theme tokens the components read exist.
          </li>
          <li>
            <strong>React 19</strong>. Several components take <code>ref</code> as a normal prop.
          </li>
          <li>
            <strong>tw-animate-css</strong> for the entrance animations (<code>shadcn init</code>{" "}
            installs it). Without it they are skipped, and motion is off for users who ask for
            reduced motion.
          </li>
        </ul>
        <p className="text-muted-foreground">
          Because they use your tokens, the components follow your theme and dark mode. See{" "}
          <Link href="/docs/theming" className="underline underline-offset-4">
            Theming
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Register the namespace</h2>
        <p className="text-muted-foreground">
          Items depend on each other through the <code>@mboa</code> namespace, so register it once.
        </p>
        <CodeBlock
          label="Register the mboa namespace"
          code={`npx shadcn@latest registry add @mboa=${registryUrlTemplate}`}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Add a country and the provider</h2>
        <p className="text-muted-foreground">
          Components never assume a country. They read it from a prop or from{" "}
          <code>MboaProvider</code>. Shared pieces, such as the country types, are installed
          automatically.
        </p>
        <CodeBlock
          label="Install a country and the provider"
          code="npx shadcn@latest add @mboa/country-cm @mboa/mboa-provider"
        />
        <p className="text-muted-foreground">
          Files land in <code>lib/mboa/</code> and <code>components/mboa/</code>, or under{" "}
          <code>src/</code> if your project uses it.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Wrap your app</h2>
        <CodeBlock label="MboaProvider example" code={providerExample} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Add components</h2>
        <p className="text-muted-foreground">
          The Phase 1 components are being built one at a time. Each gets its own docs page with a
          live preview, props table and install command as it lands.
        </p>
      </section>
    </article>
  )
}
