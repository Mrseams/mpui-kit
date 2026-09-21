export interface DocEntry {
  /** Registry item name and URL slug: /docs/components/<slug>. */
  slug: string
  title: string
  description: string
  /** "soon" entries are listed in the nav but have no page yet. */
  status: "ready" | "soon"
}

export const componentDocs: DocEntry[] = [
  {
    slug: "currency",
    title: "Currency",
    description: "Formats FCFA amounts with zero decimals and French spacing.",
    status: "ready",
  },
  {
    slug: "phone-input",
    title: "Phone input",
    description: "Detects the operator as you type, validates length and returns E.164.",
    status: "ready",
  },
  {
    slug: "payment-method-picker",
    title: "Payment method picker",
    description: "Selectable cards for Mobile Money operators, card and cash.",
    status: "ready",
  },
  {
    slug: "ussd-prompt",
    title: "USSD prompt",
    description: "Approval code with copy and dial actions, countdown and retry.",
    status: "ready",
  },
  {
    slug: "momo-checkout",
    title: "Mobile Money checkout",
    description: "A full checkout block with a payment state machine and receipt.",
    status: "ready",
  },
]

export interface GuideEntry {
  href: string
  title: string
  description: string
}

export const guideDocs: GuideEntry[] = [
  {
    href: "/docs/guides/card-and-paypal",
    title: "Card and PayPal (beta)",
    description: "Host your provider’s card fields or PayPal buttons in the checkout.",
  },
  {
    href: "/docs/headless",
    title: "Headless and framework-free",
    description: "Use the checkout logic with Vue, Svelte or plain JavaScript.",
  },
]

export const componentHref = (slug: string) => `/docs/components/${slug}`
