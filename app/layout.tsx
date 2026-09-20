import type { Metadata } from "next"

import { SiteHeader } from "@/components/site/site-header"

import "./globals.css"

export const metadata: Metadata = {
  title: { default: "mboa-ui", template: "%s · mboa-ui" },
  description:
    "Open-source shadcn/ui components for African markets: Mobile Money, FCFA, local phone numbers and bilingual FR/EN forms.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  )
}
