import type { Metadata } from "next"

import { PickerDemo } from "@/app/docs/components/payment-method-picker/picker-demo"
import { CodeBlock } from "@/components/site/code-block"
import { ComponentDoc } from "@/components/site/component-doc"
import type { PropRow } from "@/components/site/props-table"

export const metadata: Metadata = { title: "Payment method picker" }

const usage = `import { PaymentMethodPicker } from "@/components/mboa/payment-method-picker"
import { emptySelection, type PaymentSelection } from "@/lib/mboa/payment-methods"

// Inside <MboaProvider country={cm}>
const [selection, setSelection] = useState<PaymentSelection>(emptySelection)
const [ready, setReady] = useState(false)

<PaymentMethodPicker
  value={selection}
  onChange={(next, resolved) => {
    setSelection(next)
    setReady(resolved.ready)          // card and cash: true. Mobile Money: needs a valid number
    console.log(resolved.e164)        // "+237651234567" for Mobile Money once valid
  }}
/>`

const customMethods = `import { defaultPaymentMethods } from "@/lib/mboa/payment-methods"

// Mobile Money only
<PaymentMethodPicker methods={defaultPaymentMethods(cm, { card: false, cash: false })} />

// Your own list
<PaymentMethodPicker
  methods={[
    { id: "mtn", kind: "mobile_money", operatorId: "mtn" },
    { id: "cash", kind: "cash", label: "Pay on arrival", description: "No fees" },
  ]}
/>`

const props: PropRow[] = [
  {
    name: "value",
    type: "PaymentSelection",
    description:
      "The current choice: { methodId: string | null, phone: string }. phone is the national number as digits. Makes the picker controlled.",
  },
  {
    name: "defaultValue",
    type: "PaymentSelection",
    default: "nothing selected",
    description: "Initial choice for an uncontrolled picker.",
  },
  {
    name: "onChange",
    type: "(selection: PaymentSelection, resolved: ResolvedPayment) => void",
    description:
      "Called when the method or the phone number changes. resolved.ready says whether the selection can be paid, and resolved.e164 is the number for Mobile Money.",
  },
  {
    name: "methods",
    type: "PaymentMethod[]",
    default: "defaultPaymentMethods(country)",
    description:
      "Methods to offer. By default: Mobile Money for each operator with a wallet, then card and cash.",
  },
  {
    name: "country",
    type: "CountryConfig",
    default: "MboaProvider's country",
    description: "Country to use. Throws if neither this nor a provider is set.",
  },
  {
    name: "locale",
    type: '"fr" | "en"',
    default: "MboaProvider's locale, then “fr”",
    description: "Language of the labels and messages.",
  },
  {
    name: "legend",
    type: "string",
    default: "“Payment method”",
    description: "Group label read by screen readers.",
  },
  {
    name: "error",
    type: "string",
    description: "Error under the cards, for example “Choose a payment method to continue.”",
  },
  {
    name: "operatorLogos",
    type: "Record<string, ReactNode>",
    description: "Your own logos by operator id, shown instead of the color dot.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Disables every card and the phone field.",
  },
  {
    name: "phoneError",
    type: "string",
    description:
      "Error for the phone field of the chosen Mobile Money method. Overrides its built-in error.",
  },
  {
    name: "classNames",
    type: "{ legend, options, option, optionLabel, optionDescription, phone, error }",
    description:
      "Class names for parts of the picker. Style the selected card with has-[:checked]:... in option. Each part also has a data-slot attribute.",
  },
  {
    name: "...props",
    type: "ComponentProps<'fieldset'>",
    description: "Other fieldset props, such as className.",
  },
]

export default function PaymentMethodPickerPage() {
  return (
    <ComponentDoc
      name="payment-method-picker"
      title="Payment method picker"
      description="Selectable cards for Mobile Money operators, card and cash. Choosing a Mobile Money option reveals a phone input for that operator right under the cards."
      preview={<PickerDemo />}
      usage={usage}
      props={props}
    >
      <section aria-labelledby="methods" className="space-y-3">
        <h2 id="methods" className="text-xl font-semibold">
          Choosing the methods
        </h2>
        <p className="text-muted-foreground max-w-prose">
          A country offers Mobile Money for every operator that has a wallet in its data. Pass{" "}
          <code>methods</code> to change that.
        </p>
        <CodeBlock label="Custom payment methods" code={customMethods} />
      </section>

      <section aria-labelledby="notes" className="space-y-3">
        <h2 id="notes" className="text-xl font-semibold">
          Notes
        </h2>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5">
          <li>
            <strong>Native radios.</strong> The cards are radio inputs in a labelled fieldset, so
            arrow keys move the choice, the group is one tab stop, and screen readers announce it as
            a group. There is no custom key handling to break.
          </li>
          <li>
            <strong>Focus is not moved</strong> when the phone field appears, because that would
            interrupt arrow-key navigation between cards. The field sits right under the cards.
          </li>
          <li>
            The phone number is kept when you switch between Mobile Money operators, in case someone
            picked the wrong one.
          </li>
          <li>
            A number that belongs to a <em>different known</em> operator is rejected (
            <code>operator_mismatch</code>). A prefix that is not in the country data is accepted,
            because the data is community-maintained and may be incomplete.
          </li>
          <li>
            This component only collects a choice. It never calls a payment API. See the checkout
            block for the full flow.
          </li>
        </ul>
      </section>
    </ComponentDoc>
  )
}
