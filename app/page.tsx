import Link from "next/link"

import { LazyBookingDemo } from "@/components/site/booking-demo-lazy"
import { CodeBlock } from "@/components/site/code-block"
import { buttonVariants } from "@/components/ui/button"
import { registryUrlTemplate } from "@/lib/site"

const features = [
  {
    title: "Mobile Money checkout",
    body: "A tested flow: waiting for approval, success, failure, timeout and retry, with a receipt. You give it two async functions, so it works with any provider or aggregator.",
  },
  {
    title: "FCFA done right",
    body: "XAF and XOF with no decimals and French spacing (25 000 FCFA), or English grouping (25,000 FCFA). Show FCFA or the ISO code.",
  },
  {
    title: "Local phone numbers",
    body: "Detects the operator from the prefix as you type, validates the length and returns E.164. Works with react-hook-form and zod.",
  },
  {
    title: "French and English",
    body: "Every string lives in a small FR/EN dictionary, and you can override any of it. The demo above switches language live.",
  },
  {
    title: "Accessible by default",
    body: "Labelled fields, keyboard navigation, live regions for payment states, focus that moves where you need it, and reduced motion respected.",
  },
  {
    title: "Light on slow connections",
    body: "No animation library, no syntax highlighter, server-rendered docs. The demo above only downloads when you scroll to it.",
  },
]

const countryExample = `// registry/mboa/lib/countries/<iso>.ts
export const xx: CountryConfig = {
  iso: "XX",
  callingCode: "000",
  nationalNumberLength: 9,
  currency: "XOF",
  operators: [
    { id: "op1", name: "Operator", color: "#0ea5e9", prefixes: prefixRange("70", "72") },
  ],
  // ...groupSizes, locales, regions
}`

const installCommands = `npx shadcn@latest registry add @mboa=${registryUrlTemplate}
npx shadcn@latest add @mboa/country-cm @mboa/momo-checkout`

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-3xl space-y-6 px-4 pt-16 pb-12 sm:pt-24">
        <p className="text-muted-foreground text-sm">
          Open source · shadcn/ui registry · Pre-release (0.1.0 in development)
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          shadcn/ui components for African markets
        </h1>
        <p className="text-muted-foreground max-w-prose text-lg text-pretty">
          Mobile Money checkout, FCFA currency, local phone numbers with operator detection, and
          bilingual FR/EN forms. Copy-paste components that work on slow connections and low-end
          phones. Cameroon first, and other countries are a pull request away.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/docs/getting-started" className={buttonVariants({ size: "lg" })}>
            Get started
          </Link>
          <a href="#demo" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Try the demo
          </a>
          <Link href="/docs" className={buttonVariants({ variant: "ghost", size: "lg" })}>
            Read the docs
          </Link>
        </div>
      </section>

      <section
        id="demo"
        aria-labelledby="demo-title"
        className="mx-auto w-full max-w-5xl scroll-mt-20 space-y-4 px-4 py-8"
      >
        <div className="space-y-2">
          <h2 id="demo-title" className="text-2xl font-semibold tracking-tight">
            Try it: book an apartment
          </h2>
          <p className="text-muted-foreground max-w-prose">
            A fake booking priced per night in FCFA, paid with the real checkout block. The payment
            goes to a fake backend that waits a few seconds, like a customer approving on their
            phone. No real payment is made and nothing leaves your browser.
          </p>
        </div>
        <LazyBookingDemo />
        <noscript>
          <p className="text-muted-foreground text-sm">The live demo needs JavaScript.</p>
        </noscript>
      </section>

      <section
        aria-labelledby="features-title"
        className="mx-auto w-full max-w-5xl space-y-6 px-4 py-12"
      >
        <h2 id="features-title" className="text-2xl font-semibold tracking-tight">
          What is in it
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <li key={feature.title} className="bg-card space-y-2 rounded-xl border p-5">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="country-title"
        className="mx-auto w-full max-w-3xl space-y-4 px-4 py-12"
      >
        <h2 id="country-title" className="text-2xl font-semibold tracking-tight">
          Your country is a pull request away
        </h2>
        <p className="text-muted-foreground max-w-prose">
          No component hard-codes Cameroon. Operators, prefixes, currency, languages and regions
          live in one data file per country, and a test checks it for overlapping prefixes and other
          mistakes. Copy <code>cm.ts</code>, fill in your country, and open a pull request.
        </p>
        <CodeBlock label="A country data file" code={countryExample} />
        <p className="text-muted-foreground text-sm">
          The Cameroon prefixes are community data, not an authoritative source, so treat operator
          detection as a hint. The{" "}
          <Link href="/docs/components/phone-input" className="underline underline-offset-4">
            phone input docs
          </Link>{" "}
          explain what that means.
        </p>
      </section>

      <section
        aria-labelledby="install-title"
        className="mx-auto w-full max-w-3xl space-y-4 px-4 py-12"
      >
        <h2 id="install-title" className="text-2xl font-semibold tracking-tight">
          Install
        </h2>
        <p className="text-muted-foreground max-w-prose">
          You need Tailwind CSS v4, shadcn/ui and React 19. The components are copied into your
          project, so you own the code.
        </p>
        <CodeBlock label="Install commands" code={installCommands} />
        <Link href="/docs/getting-started" className={buttonVariants({ variant: "outline" })}>
          Full getting started guide
        </Link>
      </section>
    </main>
  )
}
