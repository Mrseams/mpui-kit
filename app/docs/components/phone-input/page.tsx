import type { Metadata } from "next"

import { PhoneFormDemo } from "@/app/docs/components/phone-input/phone-form-demo"
import { PhoneInputDemo } from "@/app/docs/components/phone-input/phone-input-demo"
import { CodeBlock } from "@/components/site/code-block"
import { ComponentDoc } from "@/components/site/component-doc"
import { PropsTable, type PropRow } from "@/components/site/props-table"

export const metadata: Metadata = { title: "Phone input" }

const usage = `import { PhoneInput } from "@/components/mboa/phone-input"

// Inside <MboaProvider country={cm}>
const [phone, setPhone] = useState("")

<PhoneInput
  value={phone}
  onChange={(digits, details) => {
    setPhone(digits)          // "651234567"
    console.log(details.e164) // "+237651234567" once the number is valid
  }}
/>`

const formExample = `import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { PhoneInput } from "@/components/mboa/phone-input"
import { cm } from "@/lib/mboa/countries/cm"
import { createPhoneSchema } from "@/lib/mboa/phone-schema"

const schema = z.object({ phone: createPhoneSchema(cm, { locale: "en" }) })

const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { phone: "" },
})

<form onSubmit={form.handleSubmit((data) => console.log(data.phone))}>
  <Controller
    control={form.control}
    name="phone"
    render={({ field, fieldState }) => (
      <PhoneInput
        ref={field.ref}
        name={field.name}
        value={field.value}
        onChange={(value) => field.onChange(value)}
        onBlur={field.onBlur}
        error={fieldState.error?.message}
      />
    )}
  />
</form>

// data.phone is the E.164 number: "+237651234567"`

const props: PropRow[] = [
  {
    name: "value",
    type: "string",
    description:
      'The national number as digits, e.g. "651234567". An E.164 value such as "+237651234567" is also accepted. Makes the input controlled.',
  },
  {
    name: "defaultValue",
    type: "string",
    description: "Initial value for an uncontrolled input.",
  },
  {
    name: "onChange",
    type: "(value: string, details: PhoneValidation) => void",
    description:
      "Called on every change with the national digits and the validation result. details.e164 is set once the number is valid.",
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
    description: "Language of the label, hint and built-in errors.",
  },
  {
    name: "label",
    type: "string | false",
    default: "“Phone number”",
    description: "Visible label. Pass false to hide it, and then give aria-label.",
  },
  {
    name: "hint",
    type: "string | false",
    default: "length hint",
    description: "Helper text under the input. Pass false to hide it.",
  },
  {
    name: "error",
    type: "string",
    description: "Error message from your form library. Overrides the built-in error.",
  },
  {
    name: "operator",
    type: "string",
    description:
      'Id of the operator the number must belong to, e.g. "mtn". Only a known, different operator is rejected. A prefix that is not in the data is accepted.',
  },
  {
    name: "requireOperator",
    type: "boolean",
    default: "false",
    description: "Reject numbers whose prefix matches no known operator.",
  },
  {
    name: "operatorLogos",
    type: "Record<string, ReactNode>",
    description: "Your own logos by operator id, shown in the badge instead of the color dot.",
  },
  {
    name: "name",
    type: "string",
    description:
      "Adds a hidden field with this name that holds the E.164 number, so native form posts get it whatever the visible grouping.",
  },
  {
    name: "className",
    type: "string",
    description: "Styles the outer wrapper. Use classNames.input for the text input.",
  },
  {
    name: "classNames",
    type: "{ label, field, prefix, input, badge, hint, error }",
    description:
      "Class names for parts of the field. Each part also has a data-slot attribute, such as phone-input-input.",
  },
  {
    name: "...props",
    type: "ComponentProps<'input'>",
    description: "Other input props (disabled, required, autoFocus, ref...) go to the text input.",
  },
]

const badgeProps: PropRow[] = [
  { name: "operator", type: "OperatorConfig", required: true, description: "Operator to show." },
  {
    name: "logo",
    type: "ReactNode",
    description: "Your own logo, shown instead of the color dot. mboa-ui ships no logos.",
  },
  { name: "...props", type: "ComponentProps<'span'>", description: "Any other span prop." },
]

export default function PhoneInputPage() {
  return (
    <ComponentDoc
      name="phone-input"
      title="Phone input"
      description="A phone number field for a country. It groups digits as you type, detects the operator from the prefix, validates the length and gives you the E.164 number."
      preview={<PhoneInputDemo />}
      usage={usage}
      props={props}
    >
      <section aria-labelledby="forms" className="space-y-3">
        <h2 id="forms" className="text-xl font-semibold">
          react-hook-form and zod
        </h2>
        <p className="text-muted-foreground max-w-prose">
          Use <code>Controller</code>, not <code>register</code>: the input reports digits through{" "}
          <code>onChange(value, details)</code> rather than a DOM event.{" "}
          <code>createPhoneSchema</code> accepts what people type and outputs the E.164 number, with
          French or English messages.
        </p>
        <div className="rounded-lg border p-4 sm:p-6">
          <PhoneFormDemo />
        </div>
        <CodeBlock label="react-hook-form and zod example" code={formExample} />
        <p className="text-muted-foreground text-sm">
          Install the schema helper with{" "}
          <code className="bg-muted rounded px-1 py-0.5">
            npx shadcn@latest add @mboa/phone-schema
          </code>
          . It needs <code>zod</code>, which the CLI installs for you.
        </p>
      </section>

      <section aria-labelledby="operator-badge" className="space-y-3">
        <h2 id="operator-badge" className="text-xl font-semibold">
          OperatorBadge
        </h2>
        <p className="text-muted-foreground max-w-prose">
          The badge is a color dot and the operator name. mboa-ui ships no operator logos or brand
          assets. Pass your own through <code>logo</code>, or <code>operatorLogos</code> on the
          input, if you have the right to use them.
        </p>
        <PropsTable rows={badgeProps} />
      </section>

      <section aria-labelledby="notes" className="space-y-3">
        <h2 id="notes" className="text-xl font-semibold">
          Notes
        </h2>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5">
          <li>
            <strong>Prefix data is a hint.</strong> Operator prefixes are community-maintained and
            may be incomplete or out of date, so the badge can be missing or wrong. Never route
            money by it.
          </li>
          <li>
            Accepts local numbers, <code>+237 …</code>, <code>00237 …</code> and pasted numbers with
            spaces or dashes.
          </li>
          <li>
            Errors appear when the field loses focus, not while typing, and are announced with{" "}
            <code>role=&quot;alert&quot;</code>. The detected operator is announced politely.
          </li>
          <li>
            The caret stays where you expect it while digits are regrouped, and Backspace over a
            space deletes the digit before it.
          </li>
        </ul>
      </section>
    </ComponentDoc>
  )
}
