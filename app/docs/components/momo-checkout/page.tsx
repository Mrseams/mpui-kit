import type { Metadata } from "next"
import Link from "next/link"

import { CheckoutDemo } from "@/app/docs/components/momo-checkout/checkout-demo"
import { CodeBlock } from "@/components/site/code-block"
import { ComponentDoc } from "@/components/site/component-doc"
import { PropsTable, type PropRow } from "@/components/site/props-table"

export const metadata: Metadata = { title: "Mobile Money checkout" }

const usage = `import { MomoCheckout } from "@/components/mpkit/momo-checkout"

// Inside <MpKitProvider country={cm}>
<MomoCheckout
  amount={25000}
  summary="Studio in Bastos, 1 night"
  onPay={async ({ methodId, phone, amount, currency, attempt, signal }) => {
    // Call YOUR backend. MP Kit never talks to a payment provider.
    const res = await fetch("/api/pay", {
      method: "POST",
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify({ methodId, phone, amount, currency, attempt }),
      signal,
    })
    if (!res.ok) return { status: "failed", reason: "gateway_error" }
    const { reference, ussdCode } = await res.json()
    return { status: "pending", reference, ussdCode }
  }}
  onCheckStatus={async (reference, { signal }) => {
    const res = await fetch(\`/api/pay/\${reference}\`, { signal })
    return res.json() // { status: "pending" | "success" | "failed", reason? }
  }}
  onSuccess={(receipt) => console.log("paid", receipt.reference)}
  failureMessages={{ insufficient_funds: "Your balance is too low." }}
/>`

const contract = `// What onPay receives
interface PaymentRequest {
  methodId: string       // "mtn", "orange", "card", "cash"...
  phone?: string         // E.164, for Mobile Money
  payload?: unknown      // an opaque token from a method panel: a card token, a PayPal order id
  amount: number
  currency: "XAF" | "XOF"
  attempt: number        // 1, then 2, 3... after each retry
  signal: AbortSignal    // aborted on cancel, timeout or unmount
}

// What onPay returns
type PayResult =
  | { status: "success"; reference: string }                    // done already (cash, or a backend that waits)
  | { status: "pending"; reference: string; ussdCode?: string } // now polling onCheckStatus
  | { status: "failed"; reason?: string }

// What onCheckStatus returns
type StatusResult =
  | { status: "pending" }
  | { status: "success"; reference?: string }
  | { status: "failed"; reason?: string }`

const hookUsage = `import { useMomoCheckout } from "@/hooks/mpkit/use-momo-checkout"

const { state, pay, retry, cancel, reset } = useMomoCheckout({
  amount: 25000,
  currency: "XAF",
  onPay,
  onCheckStatus,
  timeoutMs: 120_000,     // default 2 minutes
  pollIntervalMs: 3_000,  // default 3 seconds
})

pay({ methodId: "mtn", phone: "+237651234567" })
// state.status: "idle" | "awaiting_approval" | "success" | "failed" | "timeout"`

const props: PropRow[] = [
  {
    name: "amount",
    type: "number",
    required: true,
    description: "Amount to pay, in CFA francs.",
  },
  {
    name: "onPay",
    type: "(request: PaymentRequest) => Promise<PayResult>",
    required: true,
    description:
      "Starts the payment on your backend. Return pending to have onCheckStatus polled, success if it is already paid, or failed.",
  },
  {
    name: "onCheckStatus",
    type: "(reference: string, ctx: { attempt, signal }) => Promise<StatusResult>",
    description:
      "Asks your backend for the result of a pending payment, every pollIntervalMs. Without it, a pending payment simply waits for the timeout.",
  },
  {
    name: "timeoutMs",
    type: "number",
    default: "120000",
    description: "How long to wait for approval before timing out.",
  },
  {
    name: "pollIntervalMs",
    type: "number",
    default: "3000",
    description: "Time between status checks.",
  },
  {
    name: "currency",
    type: '"XAF" | "XOF"',
    default: "country's currency",
    description: "CFA franc zone.",
  },
  { name: "title", type: "string", default: "“Checkout”", description: "Heading." },
  {
    name: "summary",
    type: "ReactNode",
    description: "What is being paid for, shown under the heading.",
  },
  {
    name: "methods",
    type: "PaymentMethod[]",
    default: "defaultPaymentMethods(country)",
    description: "Payment methods to offer.",
  },
  {
    name: "panels",
    type: "Record<string, MethodPanel>",
    description:
      "Beta. Your own panel for a payment method, by method id: where you host your provider’s card fields or PayPal buttons. The panel hands back an opaque token, which reaches onPay as payload. Card details never enter MP Kit. See the card and PayPal guide.",
  },
  {
    name: "methodIcons",
    type: "Record<string, ReactNode>",
    description: "Your own icons by method id. MP Kit ships no brand logos.",
  },
  {
    name: "submitLabel",
    type: "string",
    default: "“Pay {amount}”",
    description: "Text for the Pay button.",
  },
  {
    name: "submitDisabled",
    type: "boolean",
    description: "Disables the Pay button, for example until your terms are accepted.",
  },
  {
    name: "footer",
    type: "ReactNode",
    description: "Shown under the Pay button, for example a link to your terms.",
  },
  {
    name: "receiptDetails",
    type: "{ label: string; value: ReactNode }[]",
    description: "Extra rows on the receipt, for example what was bought.",
  },
  {
    name: "failureMessages",
    type: "Record<string, string>",
    description:
      "Customer-facing messages for the failure reasons your backend returns. A reason that is not listed shows a generic message. Raw backend or error text is never shown.",
  },
  {
    name: "onSuccess",
    type: "(receipt: PaymentReceipt) => void",
    description: "Called once when a payment succeeds.",
  },
  {
    name: "onFailure",
    type: "(reason?: string) => void",
    description:
      "Called once when a payment fails, with your backend's reason. Not called on timeout.",
  },
  {
    name: "onDone",
    type: "() => void",
    description: "Called when the user presses Done on the receipt. The checkout then starts over.",
  },
  {
    name: "country",
    type: "CountryConfig",
    default: "MpKitProvider's country",
    description: "Country to use.",
  },
  {
    name: "locale",
    type: '"fr" | "en"',
    default: "MpKitProvider's locale, then “fr”",
    description: "Language.",
  },
  {
    name: "operatorLogos",
    type: "Record<string, ReactNode>",
    description: "Your own operator logos by id, shown instead of the color dot.",
  },
  {
    name: "className",
    type: "string",
    description: "Styles the root of the checkout.",
  },
  {
    name: "classNames",
    type: "{ title, summary, total, amount, form, submit, picker, prompt, cancel, receipt, failure, footer }",
    description:
      "Class names for parts of the checkout. Each part also has a data-slot attribute, such as momo-checkout-submit.",
  },
]

const receiptProps: PropRow[] = [
  {
    name: "receipt",
    type: "PaymentReceipt",
    required: true,
    description:
      "{ reference, amount, currency, methodId, phone?, paidAt }. MomoCheckout builds it for you.",
  },
  {
    name: "details",
    type: "{ label: string; value: ReactNode }[]",
    description: "Extra rows after the payment details.",
  },
  {
    name: "onDone",
    type: "() => void",
    description: "Adds a Done button that calls this.",
  },
  {
    name: "country / locale",
    type: "CountryConfig / “fr” | “en”",
    default: "from MpKitProvider",
    description: "Used to name the method and format the phone and date.",
  },
  {
    name: "classNames",
    type: "{ icon, title, list, done }",
    description:
      "Class names for parts of the card. The checkmark uses your --success color if you define one, otherwise --primary.",
  },
  {
    name: "...props",
    type: "ComponentProps<'section'>",
    description: "Other section props. A ref and tabIndex let a parent move focus to it.",
  },
]

const states: { state: string; what: string }[] = [
  {
    state: "idle",
    what: "Choose a method and, for Mobile Money, enter a number. Pay validates first.",
  },
  {
    state: "awaiting_approval",
    what: "onPay is running, then onCheckStatus is polled. Mobile Money shows the USSD prompt with a countdown. Cancel goes back to idle.",
  },
  { state: "success", what: "Shows the receipt. Done starts over." },
  {
    state: "failed",
    what: "Try again re-runs onPay with the same details, or change the payment method.",
  },
  {
    state: "timeout",
    what: "No approval before timeoutMs. Same actions as failed, plus a warning not to pay twice.",
  },
]

export default function MomoCheckoutPage() {
  return (
    <ComponentDoc
      name="momo-checkout"
      title="Mobile Money checkout"
      description="A complete checkout block. Choose a method, enter a number, approve on the phone, then see a receipt. It handles the waiting, the polling, the timeout and the retry, and never talks to a payment provider itself."
      preview={<CheckoutDemo />}
      usage={usage}
      props={props}
    >
      <section aria-labelledby="demo-note" className="space-y-2">
        <h2 id="demo-note" className="text-xl font-semibold">
          About the demo
        </h2>
        <p className="text-muted-foreground max-w-prose">
          The preview above talks to a fake backend that makes no network calls. Pick what the fake
          user does on their phone, then pay with Mobile Money. Card and cash settle straight away.
          The USSD code <code>*123#</code> is made up.
        </p>
      </section>

      <section aria-labelledby="contract" className="space-y-3">
        <h2 id="contract" className="text-xl font-semibold">
          The backend contract
        </h2>
        <p className="text-muted-foreground max-w-prose">
          You give the block two async functions. That is the whole integration, so it works with
          any provider or aggregator.
        </p>
        <CodeBlock label="onPay and onCheckStatus types" code={contract} />
      </section>

      <section aria-labelledby="more-methods" className="space-y-3">
        <h2 id="more-methods" className="text-xl font-semibold">
          Cards, PayPal and other methods (beta)
        </h2>
        <p className="text-muted-foreground max-w-prose">
          Add any method with a <code>kind</code> of <code>&quot;other&quot;</code> (or{" "}
          <code>&quot;card&quot;</code>), then give it a panel to host your provider&apos;s own
          fields or buttons. Card details never enter MP Kit: the panel returns a token and the
          checkout passes it to <code>onPay</code> as <code>payload</code>.{" "}
          <Link
            href="/docs/guides/card-and-paypal"
            className="text-foreground underline underline-offset-4"
          >
            Read the card and PayPal guide
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="states" className="space-y-3">
        <h2 id="states" className="text-xl font-semibold">
          States
        </h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <caption className="sr-only">Checkout states</caption>
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  State
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  What happens
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {states.map((row) => (
                <tr key={row.state} className="align-top">
                  <th scope="row" className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                    {row.state}
                  </th>
                  <td className="text-muted-foreground px-3 py-2">{row.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="hook" className="space-y-3">
        <h2 id="hook" className="text-xl font-semibold">
          useMomoCheckout
        </h2>
        <p className="text-muted-foreground max-w-prose">
          Want your own UI? The state machine and the async flow are a separate hook. It calls{" "}
          <code>onPay</code>, polls <code>onCheckStatus</code>, times out and cleans up. Results
          that arrive after a cancel, retry or timeout are ignored, so a slow response can never
          change the wrong attempt.
        </p>
        <CodeBlock label="useMomoCheckout usage" code={hookUsage} />
      </section>

      <section aria-labelledby="receipt" className="space-y-3">
        <h2 id="receipt" className="text-xl font-semibold">
          ReceiptCard
        </h2>
        <p className="text-muted-foreground max-w-prose">
          The receipt is its own component, installed with the checkout. Use it on a confirmation
          page too.
        </p>
        <PropsTable rows={receiptProps} />
      </section>

      <section aria-labelledby="notes" className="space-y-3">
        <h2 id="notes" className="text-xl font-semibold">
          Notes
        </h2>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5">
          <li>
            <strong>Never trust the browser for the outcome.</strong> The receipt comes from what
            your backend reports. Confirm payments on your server, for example with the
            provider&apos;s webhook, before you deliver anything.
          </li>
          <li>
            <strong>Avoid double charges.</strong> Use <code>attempt</code> or an idempotency key so
            a retry cannot create a second charge. After a timeout the block warns people who
            already approved not to pay again.
          </li>
          <li>
            <strong>Cancel does not cancel on your backend.</strong> It stops waiting and aborts the
            request signal. Cancel the payment on your side if your provider supports it.
          </li>
          <li>
            <strong>Slow networks.</strong> A few failed status checks in a row do not fail the
            payment, because the user may already have approved it. After five in a row it does.
          </li>
          <li>
            <strong>Failure messages.</strong> Raw error text and unknown reasons are never shown to
            customers. Map your reasons with <code>failureMessages</code>.
          </li>
          <li>
            <strong>Accessibility.</strong> Pressing Pay with something missing shows the error and
            moves focus to it. Focus moves to the receipt or the error when the result arrives, and
            back to the method cards after a reset.
          </li>
        </ul>
      </section>
    </ComponentDoc>
  )
}
