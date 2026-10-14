"use client"

import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCountry, useLocale } from "@/components/mpui-kit/mpui-kit-provider"
import { PhoneInput } from "@/components/mpui-kit/phone-input"
import { formatNational, type PhoneValidation } from "@/lib/mpui-kit/phone"

const copy = {
  fr: {
    title: "Modifier le compte de paiement",
    name: "Nom du titulaire",
    namePlaceholder: "Nom et prénom",
    nameError: "Indiquez le nom du titulaire.",
    holder: "Titulaire",
    cancel: "Annuler",
    save: "Enregistrer",
    saving: "Enregistrement…",
    saved: "Compte enregistré.",
  },
  en: {
    title: "Update payout account",
    name: "Account holder",
    namePlaceholder: "Full name",
    nameError: "Enter the account holder's name.",
    holder: "Holder",
    cancel: "Cancel",
    save: "Save changes",
    saving: "Saving…",
    saved: "Account saved.",
  },
}

/**
 * A payout form with a live wallet card. Typing a number switches to the
 * operator it belongs to. Wrap your app in <MpuiKitProvider country={cm}>.
 */
export function WalletForm() {
  const country = useCountry()
  const locale = useLocale()
  const t = copy[locale]

  // Only operators that run a Mobile Money wallet.
  const wallets = country.operators.filter((operator) => operator.mobileMoneyName)

  const [operatorId, setOperatorId] = useState(wallets[0]?.id)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [details, setDetails] = useState<PhoneValidation | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle")

  const wallet = wallets.find((operator) => operator.id === operatorId) ?? wallets[0]
  const nameError = submitted && name.trim() === "" ? t.nameError : undefined

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (name.trim() === "" || !details?.valid) return

    setStatus("saving")
    // Replace with a call to your API, sending details.e164.
    await new Promise((resolve) => setTimeout(resolve, 900))
    setStatus("saved")
  }

  function reset() {
    setName("")
    setPhone("")
    setDetails(null)
    setSubmitted(false)
    setStatus("idle")
  }

  return (
    <div className="mx-auto w-full max-w-md pt-16">
      <form
        noValidate
        onSubmit={onSubmit}
        className="bg-card text-card-foreground relative rounded-3xl border p-4 shadow-sm sm:p-6"
      >
        <div className="bg-muted relative mb-6 h-24 rounded-2xl">
          <WalletCard
            brand={wallet?.mobileMoneyName ?? ""}
            color={wallet?.color ?? "#64748b"}
            digits={details?.national ?? ""}
            length={country.nationalNumberLength}
            format={(digits) => formatNational(digits, country)}
            callingCode={country.callingCode}
            holder={name.trim() || t.holder}
          />
        </div>

        <h3 className="mb-4 text-lg font-medium tracking-tight sm:text-xl">{t.title}</h3>

        <div role="radiogroup" aria-label={t.title} className="bg-muted mb-5 flex rounded-xl p-1">
          {wallets.map((operator) => (
            <label
              key={operator.id}
              className="text-muted-foreground has-[:checked]:bg-background has-[:checked]:text-foreground has-[:focus-visible]:ring-ring/50 flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition has-[:checked]:shadow-sm has-[:focus-visible]:ring-3"
            >
              <input
                type="radio"
                name="wallet"
                value={operator.id}
                checked={operator.id === wallet?.id}
                onChange={() => setOperatorId(operator.id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full"
                style={{ backgroundColor: operator.color }}
              />
              {/* Short name on phones, so both options stay on one line. */}
              <span className="sm:hidden">{operator.name}</span>
              <span className="hidden sm:inline">{operator.mobileMoneyName}</span>
            </label>
          ))}
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="wallet-name" className="text-sm font-medium">
              {t.name}*
            </label>
            <Input
              id="wallet-name"
              autoComplete="name"
              placeholder={t.namePlaceholder}
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? "wallet-name-error" : undefined}
              className="h-11 rounded-xl px-3.5"
            />
            {nameError && (
              <p id="wallet-name-error" className="text-destructive text-sm">
                {nameError}
              </p>
            )}
          </div>

          <PhoneInput
            value={phone}
            operator={wallet?.id}
            requireOperator
            onChange={(next, result) => {
              setPhone(next)
              setDetails(result)
              setStatus("idle")
              // Follow the operator of the number being typed.
              if (result.operator?.mobileMoneyName) setOperatorId(result.operator.id)
            }}
            classNames={{ input: "h-11 rounded-xl" }}
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t pt-5">
          <p className="mr-auto text-sm text-emerald-600 dark:text-emerald-400" aria-live="polite">
            {status === "saved" ? t.saved : ""}
          </p>
          <Button type="button" variant="secondary" size="lg" onClick={reset}>
            {t.cancel}
          </Button>
          <Button type="submit" size="lg" disabled={status === "saving"}>
            {status === "saving" ? t.saving : t.save}
          </Button>
        </div>
      </form>
    </div>
  )
}

interface WalletCardProps {
  brand: string
  color: string
  /** National digits typed so far. */
  digits: string
  length: number
  format: (digits: string) => string
  callingCode: string
  holder: string
}

/** A decorative card that previews the number as it is typed. */
function WalletCard({
  brand,
  color,
  digits,
  length,
  format,
  callingCode,
  holder,
}: WalletCardProps) {
  // Pad with zeros so the card always shows a full, grouped number, then dim the padding.
  const formatted = format(digits.padEnd(length, "0").slice(0, length))
  let seen = 0

  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-3 -top-16 flex h-40 overflow-hidden rounded-2xl bg-neutral-950 text-white shadow-xl transition-colors sm:inset-x-6"
    >
      <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
        <p className="truncate text-sm font-semibold tracking-wide italic">{brand}</p>
        <p className="leading-tight whitespace-nowrap tabular-nums">
          <span className="block text-xs text-white/50">+{callingCode}</span>
          <span className="text-base tracking-wide sm:text-lg">
            {[...formatted].map((char, index) => {
              // A space takes the shade of the digit after it.
              const padding = seen >= digits.length
              if (/\d/.test(char)) seen++
              return (
                <span key={index} className={padding ? "text-white/30" : undefined}>
                  {char}
                </span>
              )
            })}
          </span>
        </p>
        <p className="truncate text-xs text-white/60">{holder}</p>
      </div>
      <svg
        viewBox="0 0 200 160"
        className="h-full w-20 shrink-0 sm:w-2/5"
        preserveAspectRatio="xMidYMid slice"
      >
        <g fill="none" stroke={color} strokeLinecap="round" className="transition-[stroke]">
          <path d="M-10 40 C 60 10, 90 90, 210 30" strokeWidth="26" />
          <path d="M10 140 C 70 80, 140 170, 220 100" strokeWidth="20" />
          <path d="M120 -20 C 100 50, 190 70, 170 180" strokeWidth="14" />
        </g>
        <g fill={color}>
          <circle cx="60" cy="95" r="7" />
          <circle cx="150" cy="40" r="4" />
          <circle cx="95" cy="125" r="3" />
          <circle cx="185" cy="140" r="5" />
        </g>
      </svg>
    </div>
  )
}
