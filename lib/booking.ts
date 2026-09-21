import type { Locale } from "@/lib/mpkit/countries/types"

/** The fake apartment for the landing page demo. */
export interface Listing {
  name: Record<Locale, string>
  area: string
  /** Price of one night, in FCFA. */
  pricePerNight: number
  minNights: number
  maxNights: number
}

export const listing: Listing = {
  name: { fr: "Studio meublé à Bastos", en: "Furnished studio in Bastos" },
  area: "Bastos, Yaoundé",
  pricePerNight: 25000,
  minNights: 1,
  maxNights: 14,
}

/** Keeps a number of nights a whole number within the listing's limits. */
export function clampNights(value: number, { minNights, maxNights }: Listing = listing): number {
  if (!Number.isFinite(value)) return minNights
  return Math.min(maxNights, Math.max(minNights, Math.round(value)))
}

export function bookingTotal(nights: number, { pricePerNight }: Listing = listing): number {
  return clampNights(nights) * pricePerNight
}

/** The wording of the demo, in both languages. */
export const bookingCopy = {
  fr: {
    title: "Votre réservation",
    perNight: "par nuit",
    nights: "Nuits",
    fewer: "Une nuit de moins",
    more: "Une nuit de plus",
    nightsCount: (n: number) => `${n} ${n > 1 ? "nuits" : "nuit"}`,
    apartment: "Logement",
    stay: "Séjour",
    locked: "Le séjour est verrouillé pendant le paiement.",
    fakeNote: "Démo : aucun vrai paiement n'est effectué.",
    failureCases: "Essayer les cas d'échec",
    scenarioLabel: "Que fait l'utilisateur sur son téléphone ?",
    scenarios: {
      approve: "Il valide après 4 secondes",
      decline: "Il refuse après 4 secondes",
      timeout: "Il ne répond pas (délai dépassé)",
      error: "Erreur du fournisseur de paiement",
    },
    declined: "Vous avez refusé la demande sur votre téléphone.",
    language: "Langue",
  },
  en: {
    title: "Your booking",
    perNight: "per night",
    nights: "Nights",
    fewer: "One night fewer",
    more: "One night more",
    nightsCount: (n: number) => `${n} ${n > 1 ? "nights" : "night"}`,
    apartment: "Apartment",
    stay: "Stay",
    locked: "The stay is locked while the payment is in progress.",
    fakeNote: "Demo: no real payment is made.",
    failureCases: "Try the failure cases",
    scenarioLabel: "What the user does on their phone",
    scenarios: {
      approve: "Approves after 4 seconds",
      decline: "Declines after 4 seconds",
      timeout: "Does not answer (times out)",
      error: "Payment provider error",
    },
    declined: "You declined the request on your phone.",
    language: "Language",
  },
} as const satisfies Record<Locale, unknown>
