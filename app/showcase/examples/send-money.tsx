"use client"

import { ArrowLeft, Delete } from "lucide-react"
import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Currency } from "@/components/mpui-kit/currency"
import { useCountry, useLocale } from "@/components/mpui-kit/mpui-kit-provider"
import { PhoneInput } from "@/components/mpui-kit/phone-input"
import { UssdPrompt } from "@/components/mpui-kit/ussd-prompt"
import { validatePhone } from "@/lib/mpui-kit/phone"

const MAX_AMOUNT = 500_000
const APPROVAL_MS = 60_000
// Shown if the approval prompt does not reach the phone.
const USSD_CODES: Record<string, string> = { mtn: "*123#", orange: "#150#" }

const CONTACTS = [
  { name: "Awa", phone: "677123456", tint: "from-amber-300 to-orange-500" },
  { name: "Paul", phone: "699887766", tint: "from-sky-300 to-indigo-500" },
  { name: "Mireille", phone: "655443322", tint: "from-pink-300 to-rose-500" },
  { name: "Junior", phone: "681234567", tint: "from-emerald-300 to-teal-500" },
]

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "back"] as const

const copy = {
  fr: {
    title: "Envoyer de l'argent",
    balance: "Solde",
    recent: "Récents",
    to: "Destinataire",
    amount: "Montant à envoyer",
    free: "Sans frais entre abonnés",
    send: "Envoyer",
    erase: "Effacer",
    needNumber: "Saisissez un numéro valide.",
    needAmount: "Saisissez un montant.",
    back: "Retour",
  },
  en: {
    title: "Send money",
    balance: "Balance",
    recent: "Recent",
    to: "Recipient",
    amount: "Amount to send",
    free: "No fees between subscribers",
    send: "Send",
    erase: "Delete",
    needNumber: "Enter a valid number.",
    needAmount: "Enter an amount.",
    back: "Back",
  },
}

/** A wallet-style transfer: pick a contact, tap the amount, approve on the phone. */
export function SendMoney() {
  const country = useCountry()
  const t = copy[useLocale()]

  const [phone, setPhone] = useState("")
  const [amount, setAmount] = useState(2500)
  const [submitted, setSubmitted] = useState(false)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)

  // Derived from the number, so picking a contact validates it too.
  const details = validatePhone(phone, country, { requireOperator: true })
  const operator = details.operator
  const contact = CONTACTS.find((item) => item.phone === details.national)
  const tint = operator?.color ?? "#94a3b8"

  function press(key: (typeof KEYS)[number]) {
    setAmount((current) => {
      if (key === "back") return Math.floor(current / 10)
      const next = Number(`${current || ""}${key}`)
      return next > MAX_AMOUNT ? current : next
    })
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (!details.valid || amount <= 0) return
    // Replace with a call to your API. Show the prompt once it says "pending".
    setExpiresAt(Date.now() + APPROVAL_MS)
  }

  if (expiresAt !== null && details.e164) {
    return (
      <div className="bg-card mx-auto w-full max-w-sm space-y-4 rounded-[2rem] border p-5 shadow-xl">
        <Button variant="ghost" size="sm" onClick={() => setExpiresAt(null)}>
          <ArrowLeft aria-hidden="true" /> {t.back}
        </Button>
        <p className="text-center text-4xl font-semibold tracking-tight">
          <Currency amount={amount} />
        </p>
        <UssdPrompt
          code={USSD_CODES[operator?.id ?? ""]}
          phone={details.e164}
          expiresAt={expiresAt}
          durationMs={APPROVAL_MS}
          onRetry={() => setExpiresAt(Date.now() + APPROVAL_MS)}
        />
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="bg-card text-card-foreground mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border shadow-xl"
    >
      <div className="space-y-5 p-5 pb-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">{t.title}</h3>
          <span className="bg-muted rounded-full px-3 py-1 text-xs">
            {t.balance} <Currency amount={48500} className="font-semibold" />
          </span>
        </header>

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {t.recent}
          </p>
          <div className="flex gap-3">
            {CONTACTS.map((item) => (
              <button
                key={item.phone}
                type="button"
                aria-pressed={contact === item}
                onClick={() => setPhone(item.phone)}
                className="group focus-visible:ring-ring/50 flex w-14 flex-col items-center gap-1 rounded-xl outline-none focus-visible:ring-3"
              >
                <span
                  aria-hidden="true"
                  className={`grid size-12 place-items-center rounded-full bg-gradient-to-br text-sm font-semibold text-white ring-offset-2 ring-offset-[var(--card)] transition group-aria-pressed:ring-2 group-aria-pressed:ring-[var(--foreground)] ${item.tint}`}
                >
                  {item.name[0]}
                </span>
                <span className="text-muted-foreground w-full truncate text-xs">{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        <PhoneInput
          label={t.to}
          hint={false}
          value={phone}
          requireOperator
          error={submitted && !details.valid ? t.needNumber : undefined}
          onChange={(next) => setPhone(next)}
          classNames={{ input: "h-11 rounded-xl" }}
        />
      </div>

      <div
        className="relative px-5 py-6 text-center transition-colors"
        style={{
          background: `radial-gradient(60% 70% at 50% 50%, ${tint}40, transparent 100%)`,
        }}
      >
        <p className="text-muted-foreground text-xs">{t.amount}</p>
        <p
          className="mt-1 text-5xl font-semibold tracking-tight tabular-nums"
          aria-live="polite"
          aria-atomic="true"
        >
          <Currency amount={amount} display="none" />
          <span className="text-muted-foreground ml-2 text-lg font-medium">FCFA</span>
        </p>
        <p className="text-muted-foreground mt-2 text-xs">
          {submitted && amount <= 0 ? (
            <span className="text-destructive">{t.needAmount}</span>
          ) : (
            t.free
          )}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 px-5">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => press(key)}
            aria-label={key === "back" ? t.erase : undefined}
            className="hover:bg-muted active:bg-muted focus-visible:ring-ring/50 grid h-12 place-items-center rounded-2xl text-xl font-medium transition outline-none focus-visible:ring-3 active:scale-95"
          >
            {key === "back" ? <Delete aria-hidden="true" className="size-5" /> : key}
          </button>
        ))}
      </div>

      <div className="p-5">
        <Button
          type="submit"
          size="lg"
          className="h-12 w-full rounded-2xl text-base"
          style={operator ? { backgroundColor: tint, color: "#0a0a0a" } : undefined}
        >
          {t.send} <Currency amount={amount} />
          {contact ? ` · ${contact.name}` : ""}
        </Button>
      </div>
    </form>
  )
}
