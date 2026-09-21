/**
 * The `classNames` keys of each component, for the Theming docs page. A test
 * (class-slots.test.ts) checks this list against the component source, so the
 * docs cannot drift from the code.
 */
export interface ClassSlots {
  component: string
  /** Source file under registry/mboa/components/. */
  file: string
  /** Prefix of the data-slot attributes, such as "phone-input". */
  slotPrefix: string
  keys: string[]
  /** Keys that are passed to a child component, which has its own data-slot. */
  forwarded?: string[]
}

export const classSlots: ClassSlots[] = [
  {
    component: "MomoCheckout",
    file: "momo-checkout.tsx",
    slotPrefix: "momo-checkout",
    keys: [
      "title",
      "summary",
      "total",
      "amount",
      "form",
      "submit",
      "picker",
      "prompt",
      "cancel",
      "receipt",
      "failure",
    ],
    forwarded: ["picker", "prompt", "receipt"],
  },
  {
    component: "PaymentMethodPicker",
    file: "payment-method-picker.tsx",
    slotPrefix: "payment-method-picker",
    keys: ["legend", "options", "option", "optionLabel", "optionDescription", "phone", "error"],
    forwarded: ["phone"],
  },
  {
    component: "PhoneInput",
    file: "phone-input.tsx",
    slotPrefix: "phone-input",
    keys: ["label", "field", "prefix", "input", "badge", "hint", "error"],
  },
  {
    component: "UssdPrompt",
    file: "ussd-prompt.tsx",
    slotPrefix: "ussd-prompt",
    keys: ["indicator", "title", "phone", "codeBox", "code", "status", "bar", "countdown", "retry"],
  },
  {
    component: "ReceiptCard",
    file: "receipt-card.tsx",
    slotPrefix: "receipt-card",
    keys: ["icon", "title", "amount", "list", "done"],
  },
]
