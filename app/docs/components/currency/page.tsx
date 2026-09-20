import type { Metadata } from "next"

import { CurrencyDemo } from "@/app/docs/components/currency/currency-demo"
import { ComponentDoc } from "@/components/site/component-doc"
import type { PropRow } from "@/components/site/props-table"

export const metadata: Metadata = { title: "Currency" }

const usage = `import { Currency } from "@/components/mboa/currency"

// Inside <MboaProvider country={cm}>
<Currency amount={25000} />                  // 25 000 FCFA
<Currency amount={25000} display="code" />   // 25 000 XAF
<Currency amount={25000} locale="en" />      // 25,000 FCFA

// Without a provider, pass the currency (or a country) yourself
<Currency amount={25000} currency="XOF" display="code" />

// Outside components, use the function directly
import { formatFcfa } from "@/lib/mboa/format-fcfa"
formatFcfa(25000) // "25 000 FCFA"`

const props: PropRow[] = [
  {
    name: "amount",
    type: "number",
    required: true,
    description: "Amount in CFA francs. Rounded to zero decimals. Invalid numbers render “—”.",
  },
  {
    name: "display",
    type: '"symbol" | "code" | "none"',
    default: '"symbol"',
    description: "Show FCFA, the ISO code (XAF or XOF), or the number only.",
  },
  {
    name: "currency",
    type: '"XAF" | "XOF"',
    default: "country's currency",
    description: "CFA franc zone. Overrides the country.",
  },
  {
    name: "country",
    type: "CountryConfig",
    default: "MboaProvider's country",
    description: "Country to take the currency from.",
  },
  {
    name: "locale",
    type: '"fr" | "en"',
    default: "MboaProvider's locale, then “fr”",
    description: "Digit grouping. French gives 25 000, English gives 25,000.",
  },
  {
    name: "...props",
    type: "ComponentProps<'span'>",
    description: "Any other span prop, such as className.",
  },
]

export default function CurrencyPage() {
  return (
    <ComponentDoc
      name="currency"
      title="Currency"
      description="Displays an amount of CFA francs with zero decimals and French spacing. Works for XAF (Central Africa) and XOF (West Africa)."
      preview={<CurrencyDemo />}
      usage={usage}
      props={props}
    >
      <section aria-labelledby="notes" className="space-y-3">
        <h2 id="notes" className="text-xl font-semibold">
          Notes
        </h2>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5">
          <li>
            Digits are grouped with a no-break space, so an amount never wraps in the middle of a
            price. This is the same across browsers, whatever space character Intl emits.
          </li>
          <li>CFA francs have no decimals, so fractions are rounded, never shown.</li>
          <li>
            The <code>Currency</code> component needs a country or a currency, and throws a clear
            error if it has neither.
          </li>
        </ul>
      </section>
    </ComponentDoc>
  )
}
