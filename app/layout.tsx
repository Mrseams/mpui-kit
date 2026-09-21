import type { Metadata } from "next"
import localFont from "next/font/local"

import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { themeInitScript } from "@/lib/theme"

import "./globals.css"

// Self-hosted, latin subset only (it covers French accents), three weights. No
// request to Google, and the font files are preloaded.
const poppins = localFont({
  src: [
    { path: "./fonts/poppins-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/poppins-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/poppins-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial"],
  adjustFontFallback: "Arial",
})

export const metadata: Metadata = {
  title: { default: "MP Kit", template: "%s · MP Kit" },
  description:
    "Open-source shadcn/ui components for African markets: Mobile Money, FCFA, local phone numbers and bilingual FR/EN forms.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the script below adds the "dark" class to <html>
    // before React hydrates, so the server and client markup differ on purpose.
    <html lang="en" className={`${poppins.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}
