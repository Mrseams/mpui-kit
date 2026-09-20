/**
 * Themes for the Theming docs demo. A theme is a set of CSS variables put on a
 * wrapper element: the components read the same tokens as the rest of a shadcn
 * app (--primary, --radius, ...), so changing them changes every component
 * inside the wrapper. Nothing here is specific to mboa-ui.
 */
export interface DemoTheme {
  id: string
  label: string
  description: string
  /** Extra class on the wrapper, such as `dark`. */
  className: string
  /** CSS variables set on the wrapper. */
  variables: Record<`--${string}`, string>
}

export const demoThemes: DemoTheme[] = [
  {
    id: "default",
    label: "Default",
    description: "Whatever theme this site is using: shadcn's neutral theme.",
    className: "",
    variables: {},
  },
  {
    id: "dark",
    label: "Dark",
    description: "The app's dark mode, switched on with the dark class.",
    className: "dark",
    variables: {},
  },
  {
    id: "brand",
    label: "Green brand, soft corners",
    description: "A green primary color, a matching --success and larger corners.",
    className: "",
    variables: {
      "--primary": "oklch(0.52 0.15 150)",
      "--primary-foreground": "oklch(0.98 0 0)",
      "--ring": "oklch(0.52 0.15 150)",
      "--success": "oklch(0.52 0.15 150)",
      "--radius": "1rem",
    },
  },
  {
    id: "sharp",
    label: "Warm, sharp corners",
    description: "An orange primary color, a warm background and square corners.",
    className: "",
    variables: {
      "--primary": "oklch(0.6 0.19 40)",
      "--primary-foreground": "oklch(0.99 0 0)",
      "--ring": "oklch(0.6 0.19 40)",
      "--background": "oklch(0.98 0.012 80)",
      "--card": "oklch(0.995 0.006 80)",
      "--radius": "0px",
    },
  },
]

/** The tokens the components read, and where they show up. Used for the docs table. */
export const themeTokens: { token: string; usedFor: string }[] = [
  { token: "--background", usedFor: "Payment method cards, badges and the phone field." },
  { token: "--foreground", usedFor: "Text. Inherited from the page." },
  { token: "--card", usedFor: "The checkout, the USSD prompt and the receipt." },
  {
    token: "--muted / --muted-foreground",
    usedFor: "Secondary text, hints, hover states and disabled dots.",
  },
  {
    token: "--primary / --primary-foreground",
    usedFor: "The Pay button, the selected card, the waiting dots and the receipt checkmark.",
  },
  { token: "--destructive", usedFor: "Error messages, and the failure and timeout panel." },
  { token: "--border / --input", usedFor: "Card borders and the phone field border." },
  { token: "--ring", usedFor: "Focus rings on the cards and buttons." },
  { token: "--radius", usedFor: "Corner radius of every card, button and field." },
  {
    token: "--success (optional)",
    usedFor: "The receipt checkmark. Falls back to --primary when you do not define it.",
  },
]
