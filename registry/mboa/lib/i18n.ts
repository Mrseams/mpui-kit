import type { Locale } from "@/lib/mboa/countries/types"

// English is the source of truth for the key set; French must provide every key
// (enforced by the `Messages` type below and by i18n.test.ts).
const en = {
  "lang.label": "Language",

  "phone.label": "Phone number",
  "phone.hint": "Enter your {length}-digit number, without the country code.",
  "phone.operatorDetected": "{operator} number",
  "phone.operatorUnknown": "Operator not recognized",
  "phone.error.empty": "Enter a phone number.",
  "phone.error.tooShort": "The number is too short. It should have {length} digits.",
  "phone.error.tooLong": "The number is too long. It should have {length} digits.",
  "phone.error.wrongCountry": "This number does not belong to {country}.",
  "phone.error.invalidChars": "Use digits only.",
  "phone.error.unknownOperator": "This number does not match a known operator.",
  "phone.error.operatorMismatch": "This number does not belong to {operator}.",

  "picker.legend": "Payment method",
  "picker.mobileMoneyDescription": "Approve on your phone",
  "picker.card": "Bank card",
  "picker.cardDescription": "Pay with your bank card",
  "picker.cash": "Cash",
  "picker.cashDescription": "Pay in person",
  "picker.phoneLabel": "{operator} number",

  "ussd.title": "Approve the payment on your phone",
  "ussd.instructions": "If you do not get a prompt, dial the code below, then enter your PIN.",
  "ussd.codeLabel": "Approval code",
  "ussd.copy": "Copy code",
  "ussd.copied": "Code copied",
  "ussd.dial": "Dial now",
  "ussd.waiting": "Waiting for your approval…",
  "ussd.expiresIn": "Expires in {time}",
  "ussd.timeout": "The request expired.",
  "ussd.retry": "Try again",

  "checkout.total": "Total",
  "checkout.pay": "Pay {amount}",
  "checkout.selectMethod": "Choose a payment method to continue.",
  "checkout.sending": "Sending the request…",
  "checkout.cancel": "Cancel",
  "checkout.changeMethod": "Change payment method",
  "checkout.failedTitle": "Payment not completed",
  "checkout.failedBody": "The payment was declined or could not be processed.",
  "checkout.timeoutTitle": "Request expired",
  "checkout.timeoutBody": "We did not receive your approval in time.",

  "receipt.title": "Payment received",
  "receipt.reference": "Reference",
  "receipt.amount": "Amount",
  "receipt.method": "Method",
  "receipt.phone": "Phone",
  "receipt.date": "Date",
  "receipt.done": "Done",

  "status.awaiting": "Waiting for approval on your phone.",
  "status.success": "Payment successful.",
  "status.failed": "Payment not completed.",
  "status.timeout": "The request expired.",
}

export type MessageKey = keyof typeof en
export type Messages = Record<MessageKey, string>
/** Lets apps override or extend wording without forking the dictionary. */
export type MessageOverrides = Partial<Messages>
export type MessageParams = Record<string, string | number>
export type Translator = (key: MessageKey, params?: MessageParams) => string

const fr: Messages = {
  "lang.label": "Langue",

  "phone.label": "Numéro de téléphone",
  "phone.hint": "Saisissez votre numéro à {length} chiffres, sans l'indicatif du pays.",
  "phone.operatorDetected": "Numéro {operator}",
  "phone.operatorUnknown": "Opérateur non reconnu",
  "phone.error.empty": "Saisissez un numéro de téléphone.",
  "phone.error.tooShort": "Le numéro est trop court. Il doit comporter {length} chiffres.",
  "phone.error.tooLong": "Le numéro est trop long. Il doit comporter {length} chiffres.",
  "phone.error.wrongCountry": "Ce numéro n'appartient pas à ce pays : {country}.",
  "phone.error.invalidChars": "Utilisez uniquement des chiffres.",
  "phone.error.unknownOperator": "Ce numéro ne correspond à aucun opérateur connu.",
  "phone.error.operatorMismatch": "Ce numéro n'appartient pas à {operator}.",

  "picker.legend": "Moyen de paiement",
  "picker.mobileMoneyDescription": "Validez sur votre téléphone",
  "picker.card": "Carte bancaire",
  "picker.cardDescription": "Payez avec votre carte bancaire",
  "picker.cash": "Espèces",
  "picker.cashDescription": "Payez sur place",
  "picker.phoneLabel": "Numéro {operator}",

  "ussd.title": "Validez le paiement sur votre téléphone",
  "ussd.instructions":
    "Si vous ne recevez pas de demande, composez le code ci-dessous, puis saisissez votre code PIN.",
  "ussd.codeLabel": "Code de validation",
  "ussd.copy": "Copier le code",
  "ussd.copied": "Code copié",
  "ussd.dial": "Composer maintenant",
  "ussd.waiting": "En attente de votre validation…",
  "ussd.expiresIn": "Expire dans {time}",
  "ussd.timeout": "La demande a expiré.",
  "ussd.retry": "Réessayer",

  "checkout.total": "Total",
  "checkout.pay": "Payer {amount}",
  "checkout.selectMethod": "Choisissez un moyen de paiement pour continuer.",
  "checkout.sending": "Envoi de la demande…",
  "checkout.cancel": "Annuler",
  "checkout.changeMethod": "Changer de moyen de paiement",
  "checkout.failedTitle": "Paiement non abouti",
  "checkout.failedBody": "Le paiement a été refusé ou n'a pas pu être traité.",
  "checkout.timeoutTitle": "Demande expirée",
  "checkout.timeoutBody": "Nous n'avons pas reçu votre validation à temps.",

  "receipt.title": "Paiement reçu",
  "receipt.reference": "Référence",
  "receipt.amount": "Montant",
  "receipt.method": "Moyen",
  "receipt.phone": "Téléphone",
  "receipt.date": "Date",
  "receipt.done": "Terminé",

  "status.awaiting": "En attente de validation sur votre téléphone.",
  "status.success": "Paiement réussi.",
  "status.failed": "Paiement non abouti.",
  "status.timeout": "La demande a expiré.",
}

export const messages: Record<Locale, Messages> = { en, fr }

const PLACEHOLDER = /\{(\w+)\}/g

/** Replaces `{name}` placeholders. Unknown placeholders are left as-is so gaps are visible. */
export function interpolate(template: string, params?: MessageParams): string {
  if (!params) return template
  return template.replace(PLACEHOLDER, (match, name: string) =>
    name in params ? String(params[name]) : match
  )
}

export function translate(
  locale: Locale,
  key: MessageKey,
  params?: MessageParams,
  overrides?: MessageOverrides
): string {
  return interpolate(overrides?.[key] ?? messages[locale][key], params)
}

export function createTranslator(locale: Locale, overrides?: MessageOverrides): Translator {
  return (key, params) => translate(locale, key, params, overrides)
}
