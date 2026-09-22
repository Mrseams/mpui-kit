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

const countryExample = `// registry/mpkit/lib/countries/<iso>.ts
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

const installCommands = `npx shadcn@latest registry add @mpkit=${registryUrlTemplate}
npx shadcn@latest add @mpkit/country-cm @mpkit/momo-checkout`

// Every section sits in the same column as the header, so the left and right
// edges line up all the way down the page.
const column = "mx-auto w-full max-w-6xl px-4"

// A section heading and its intro, centered on the page axis.
function SectionIntro({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-3 text-center">
      <h2 id={id} className="text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      {children && <div className="text-muted-foreground text-pretty">{children}</div>}
    </div>
  )
}

export default function Home() {
  return (
    <main className="flex-1">
      <section className={`${column} pt-16 pb-14 sm:pt-24`}>
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 mx-auto max-w-3xl space-y-6 text-center motion-safe:duration-700">
          <p className="text-muted-foreground text-sm">
            Open source · shadcn/ui registry · Pre-release (0.1.0 in development)
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            shadcn/ui components for mobile payments
          </h1>
          <p className="text-muted-foreground text-lg text-pretty">
            Mobile Money checkout, FCFA currency, local phone numbers with operator detection, and
            bilingual FR/EN forms. Copy-paste components that work on slow connections and low-end
            phones. Cameroon first, and other countries are a pull request away.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/docs/getting-started" className={buttonVariants({ size: "lg" })}>
              Get started
            </Link>
            <a href="#demo" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Try the demo
            </a>
            <Link href="/docs" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Read the docs
            </Link>
          </div>
        </div>
      </section>

      <section
        id="demo"
        aria-labelledby="demo-title"
        className={`${column} scroll-mt-20 space-y-8 py-10`}
      >
        <SectionIntro id="demo-title" title="Try it: book an apartment">
          A fake booking priced per night in FCFA, paid with the real checkout block. The payment
          goes to a fake backend that waits a few seconds, like a customer approving on their phone.
          No real payment is made and nothing leaves your browser.
        </SectionIntro>
        <LazyBookingDemo />
        <noscript>
          <p className="text-muted-foreground text-center text-sm">
            The live demo needs JavaScript.
          </p>
        </noscript>
      </section>

      <section aria-labelledby="features-title" className={`${column} space-y-8 py-14`}>
        <SectionIntro id="features-title" title="What is in it" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <li key={feature.title} className="bg-card space-y-2 rounded-xl border p-5">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="country-title" className={`${column} space-y-6 py-14`}>
        <SectionIntro id="country-title" title="Your country is a pull request away">
          No component hard-codes Cameroon. Operators, prefixes, currency, languages and regions
          live in one data file per country, and a test checks it for overlapping prefixes and other
          mistakes. Copy <code>cm.ts</code>, fill in your country, and open a pull request.
        </SectionIntro>
        <div className="mx-auto max-w-3xl space-y-3">
          <CodeBlock label="A country data file" code={countryExample} />
          <p className="text-muted-foreground text-center text-sm">
            The Cameroon prefixes are community data, not an authoritative source, so treat operator
            detection as a hint. The{" "}
            <Link href="/docs/components/phone-input" className="underline underline-offset-4">
              phone input docs
            </Link>{" "}
            explain what that means.
          </p>
        </div>
      </section>

      <section aria-labelledby="install-title" className={`${column} space-y-6 py-14`}>
        <SectionIntro id="install-title" title="Install">
          You need Tailwind CSS v4, shadcn/ui and React 19. The components are copied into your
          project, so you own the code.
        </SectionIntro>
        <div className="mx-auto max-w-3xl space-y-4">
          <CodeBlock label="Install commands" code={installCommands} />
          <div className="flex justify-center">
            <Link href="/docs/getting-started" className={buttonVariants({ variant: "outline" })}>
              Full getting started guide
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
