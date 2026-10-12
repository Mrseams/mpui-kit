import { ImageResponse } from "next/og"

export const alt = "MPUI-KIT: shadcn/ui components for mobile payments"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/** The link preview shown on WhatsApp, X, Slack and the like. Rendered at build time. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "#0b0b0b",
        color: "#fafafa",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <svg viewBox="0 0 64 64" width="112" height="112">
          <rect width="64" height="64" rx="14" fill="#fafafa" />
          <g fill="none" stroke="#0b0b0b" strokeWidth="5.5" strokeLinecap="round">
            <path d="M19 22v16M12.07 26l13.86 8M12.07 34l13.86-8" />
            <path d="M40 18l-3.5 28M49.5 18L46 46M32.5 26.5h21M31 37.5h21" />
          </g>
        </svg>
        <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1 }}>MPUI-KIT</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <span style={{ fontSize: 68, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>
          shadcn/ui components for mobile payments
        </span>
        <span style={{ fontSize: 30, color: "#a1a1aa" }}>
          Mobile Money checkout · FCFA · local phone numbers · FR/EN
        </span>
      </div>
    </div>,
    size
  )
}
