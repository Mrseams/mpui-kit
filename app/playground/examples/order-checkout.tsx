"use client"

import { Currency } from "@/components/mpui-kit/currency"
import { MomoCheckout } from "@/components/mpui-kit/momo-checkout"
import { useLocale } from "@/components/mpui-kit/mpui-kit-provider"
import type { PayResult, PaymentRequest, StatusResult } from "@/hooks/mpui-kit/use-momo-checkout"

// A fake backend so the example runs on its own. Replace both functions with
// calls to your API, which talks to your Mobile Money provider.
const startedAt = new Map<string, number>()

async function onPay(request: PaymentRequest): Promise<PayResult> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  const reference = `ORD-${Date.now().toString(36).toUpperCase()}`
  if (request.methodId === "card" || request.methodId === "cash") {
    return { status: "success", reference }
  }
  startedAt.set(reference, Date.now())
  return {
    status: "pending",
    reference,
    ussdCode: request.methodId === "orange" ? "#150#" : "*123#",
  }
}

async function onCheckStatus(reference: string): Promise<StatusResult> {
  // Pretend the customer approves on their phone after 4 seconds.
  const approved = Date.now() - (startedAt.get(reference) ?? 0) > 4_000
  return approved ? { status: "success" } : { status: "pending" }
}

const DELIVERY = 1000

const copy = {
  fr: {
    restaurant: "Chez Tantine",
    area: "Bastos, Yaoundé · 25–35 min",
    order: "Votre commande",
    subtotal: "Sous-total",
    delivery: "Livraison",
    total: "Total",
    pay: "Paiement",
    receipt: "Commande",
    items: [
      { emoji: "🍲", name: "Ndolé aux crevettes", qty: 2, price: 3000 },
      { emoji: "🍌", name: "Plantain mûr frit", qty: 1, price: 1000 },
      { emoji: "🥤", name: "Jus de foléré", qty: 2, price: 500 },
    ],
  },
  en: {
    restaurant: "Chez Tantine",
    area: "Bastos, Yaoundé · 25–35 min",
    order: "Your order",
    subtotal: "Subtotal",
    delivery: "Delivery",
    total: "Total",
    pay: "Payment",
    receipt: "Order",
    items: [
      { emoji: "🍲", name: "Ndolé with shrimp", qty: 2, price: 3000 },
      { emoji: "🍌", name: "Fried ripe plantain", qty: 1, price: 1000 },
      { emoji: "🥤", name: "Hibiscus juice", qty: 2, price: 500 },
    ],
  },
}

/** A food order: a receipt-style summary next to the full checkout block. */
export function OrderCheckout() {
  const t = copy[useLocale()]
  const subtotal = t.items.reduce((sum, item) => sum + item.qty * item.price, 0)
  const total = subtotal + DELIVERY

  return (
    <div className="bg-card mx-auto grid w-full max-w-4xl overflow-hidden rounded-3xl border shadow-xl md:grid-cols-[0.85fr_1.15fr]">
      <aside className="relative overflow-hidden bg-neutral-950 p-6 text-white sm:p-8">
        <svg
          aria-hidden="true"
          viewBox="0 0 200 200"
          className="pointer-events-none absolute -top-20 -right-20 size-52 opacity-90"
        >
          <g fill="none" stroke="#f59e0b" strokeLinecap="round">
            <path d="M20 40 C 80 0, 120 90, 210 50" strokeWidth="22" />
            <path d="M60 170 C 100 110, 160 190, 230 120" strokeWidth="14" />
          </g>
          <circle cx="70" cy="110" r="6" fill="#f59e0b" />
          <circle cx="150" cy="95" r="3" fill="#f59e0b" />
        </svg>

        <div className="relative space-y-1">
          <p className="text-lg font-semibold">{t.restaurant}</p>
          <p className="text-sm text-white/60">{t.area}</p>
        </div>

        <h3 className="relative mt-8 mb-4 text-xs font-medium tracking-wide text-white/50 uppercase">
          {t.order}
        </h3>
        <ul className="relative space-y-4">
          {t.items.map((item) => (
            <li key={item.name} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-xl"
              >
                {item.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-snug font-medium">{item.name}</span>
                <span className="text-xs text-white/50">
                  {item.qty} × <Currency amount={item.price} />
                </span>
              </span>
              <Currency amount={item.qty * item.price} className="text-sm tabular-nums" />
            </li>
          ))}
        </ul>

        <dl className="relative mt-8 space-y-2 border-t border-dashed border-white/20 pt-5 text-sm">
          <div className="flex justify-between text-white/60">
            <dt>{t.subtotal}</dt>
            <dd>
              <Currency amount={subtotal} />
            </dd>
          </div>
          <div className="flex justify-between text-white/60">
            <dt>{t.delivery}</dt>
            <dd>
              <Currency amount={DELIVERY} />
            </dd>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <dt className="font-medium">{t.total}</dt>
            <dd className="text-2xl font-semibold tracking-tight">
              <Currency amount={total} />
            </dd>
          </div>
        </dl>
      </aside>

      <div className="p-6 sm:p-8">
        <MomoCheckout
          // The outer card already draws the frame.
          className="rounded-none border-0 bg-transparent p-0 sm:p-0"
          title={t.pay}
          amount={total}
          receiptDetails={[{ label: t.receipt, value: t.restaurant }]}
          timeoutMs={30_000}
          pollIntervalMs={1_000}
          onPay={onPay}
          onCheckStatus={onCheckStatus}
        />
      </div>
    </div>
  )
}
