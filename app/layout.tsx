import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "mboa-ui",
  description:
    "Open-source shadcn/ui components for African markets: Mobile Money, FCFA, local phone numbers and bilingual FR/EN forms.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
