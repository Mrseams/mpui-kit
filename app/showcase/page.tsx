import { readFileSync } from "node:fs"
import { join } from "node:path"

import type { Metadata } from "next"
import Link from "next/link"

import { OrderCheckout } from "@/app/showcase/examples/order-checkout"
import { SendMoney } from "@/app/showcase/examples/send-money"
import { WalletForm } from "@/app/showcase/examples/wallet-form"
import { BuildingBlocks, ShowcaseProvider } from "@/app/showcase/building-blocks"
import { Showcase } from "@/app/showcase/showcase"
import { buttonVariants } from "@/components/ui/button"
import { highlight } from "@/lib/highlight"

export const metadata: Metadata = { title: "Showcase" }

// The code tab shows the very file the preview runs, read at build time, so the
// two can never drift apart.
function source(file: string) {
  return readFileSync(join(process.cwd(), "app/showcase/examples", file), "utf8")
}

const examples = [
  {
    title: "Payout account with a live card",
    description:
      "The card previews the number as it is typed and switches to the operator the prefix belongs to. Validation and E.164 come from PhoneInput.",
    items: ["country-cm", "phone-input"],
    file: "wallet-form.tsx",
    preview: <WalletForm />,
  },
  {
    title: "Send money, wallet style",
    description:
      "Tap a recent contact or type a number, then the amount on a keypad. The screen takes the operator's color, and Send leads to the approval prompt.",
    items: ["country-cm", "currency", "phone-input", "ussd-prompt"],
    file: "send-money.tsx",
    preview: <SendMoney />,
  },
  {
    title: "Food order checkout",
    description:
      "A receipt-style order summary next to the full checkout block: choose a method, approve on the phone, get a receipt. Swap the two fake functions for calls to your API.",
    items: ["country-cm", "momo-checkout"],
    file: "order-checkout.tsx",
    preview: <OrderCheckout />,
  },
]

export default async function ShowcasePage() {
  const sources = await Promise.all(
    examples.map(async (example) => {
      const code = source(example.file)
      return { code, html: await highlight(code) }
    })
  )

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-12 pb-20">
      <header className="mx-auto max-w-2xl space-y-4 pb-10 text-center">
        <p className="text-muted-foreground text-sm">Showcase</p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Copy a payment form, ship it today
        </h1>
        <p className="text-muted-foreground text-lg text-pretty">
          Real forms built with MPUI-KIT. Play with them, open the code, copy it into your app. Try
          a number like <code className="text-foreground whitespace-nowrap">6 77 12 34 56</code> or{" "}
          <code className="text-foreground whitespace-nowrap">6 99 12 34 56</code>.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/docs/getting-started" className={buttonVariants({ size: "lg" })}>
            Set up the registry
          </Link>
          <Link href="/docs" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Browse components
          </Link>
        </div>
      </header>

      <ShowcaseProvider>
        <div className="space-y-16">
          {examples.map((example, index) => (
            <Showcase
              key={example.file}
              title={example.title}
              description={example.description}
              items={example.items}
              filename={example.file}
              code={sources[index].code}
              html={sources[index].html}
            >
              {example.preview}
            </Showcase>
          ))}

          <section aria-labelledby="blocks-title" className="space-y-4">
            <div className="max-w-xl space-y-1">
              <h2 id="blocks-title" className="text-xl font-semibold tracking-tight">
                Building blocks
              </h2>
              <p className="text-muted-foreground text-sm">
                Each component on its own, with the values it hands back to your code.
              </p>
            </div>
            <BuildingBlocks />
          </section>
        </div>
      </ShowcaseProvider>
    </main>
  )
}
