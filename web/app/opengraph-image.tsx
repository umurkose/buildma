import { ImageResponse } from "next/og"

import { SITE } from "@/core/meta"

export const alt = `${SITE.name} — ${SITE.tagline}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const INK = "#0a0a0a"
const MUTED = "#6b7280"

// --- Open Graph card ---

// Centred mark, name, one line. Nothing else.
//
// A share card is rendered at ~500px wide in a timeline and thumbnailed smaller than
// that in a chat preview. The previous card carried a headline, a subhead, four pills
// and a mock email — at share size that is texture, not information, and the mark it
// was all arranged around was 56px. What survives the shrink is a shape and a name, so
// the card is now only those.
//
// The mark is the same three bars as components/ui/logo.tsx, drawn with divs because
// next/og rasterises a subset of CSS and cannot take the SVG component.
export default function OpengraphImage() {
  const bar = (width: number, opacity = 1) => ({
    width,
    height: 22,
    borderRadius: 11,
    background: INK,
    opacity,
  })

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          background: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* The three widths stepping down are what make this read as an email rather
            than as a hamburger menu — heading, body, button. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={bar(132)} />
          <div style={bar(90, 0.45)} />
          <div style={bar(56)} />
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            color: INK,
            letterSpacing: -2.5,
          }}
        >
          {SITE.name}
        </div>

        <div style={{ display: "flex", fontSize: 30, color: MUTED, letterSpacing: -0.3 }}>
          {SITE.tagline}
        </div>
      </div>
    ),
    size,
  )
}
