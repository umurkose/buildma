// Dark-mode colours for an email.
//
// One mapping, used twice: the editor's canvas when the app is dark, and the
// exported HTML's `prefers-color-scheme: dark` overrides — so what you see in a
// dark editor is what a reader sees in a dark inbox.
//
// The rule follows what good mail clients do. Neutral colours — white paper, black
// and grey text, pale rules — swap their lightness (in OKLCH, so the hue is kept
// and the result looks deliberate rather than inverted). Saturated mid-tone colours
// are brand colours — a blue button, a social badge — and stay exactly as they are.
// Text keeps to whatever its own background does: on a kept brand fill it is kept
// too, so a button's white label stays white on its blue.

type Lab = [number, number, number]

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

function parse(hex: string): [number, number, number] | null {
  const m = HEX.exec(hex.trim())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1]
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number]
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

function toOklab([r, g, b]: [number, number, number]): Lab {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)]
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function toRgb([L, a, b]: Lab): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const inGamut = (rgb: number[]) => rgb.every((c) => c >= -0.0005 && c <= 1.0005)

function toHex(lab: Lab): string {
  // Out of gamut: give up chroma, never lightness, until it fits.
  const L = lab[0]
  let [, a, b] = lab
  let rgb = toRgb([L, a, b])
  for (let i = 0; i < 24 && !inGamut(rgb); i++) {
    a *= 0.9
    b *= 0.9
    rgb = toRgb([L, a, b])
  }
  return (
    "#" +
    rgb
      .map((c) => Math.round(Math.min(1, Math.max(0, toGamma(Math.min(1, Math.max(0, c))))) * 255))
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")
  )
}

/** A saturated mid-tone: a brand colour that reads on light and dark alike. */
export function isBrand(color: string): boolean {
  const rgb = parse(color)
  if (!rgb) return false
  const [L, a, b] = toOklab(rgb)
  return Math.hypot(a, b) > 0.07 && L > 0.35 && L < 0.82
}

const fills = new Map<string, string>()
const texts = new Map<string, string>()

// Lightness swapped onto 0.2–0.97, so white paper lands on a soft near-black
// (about #171717) rather than pure black. Text takes a gentler curve that lifts the
// middle: a mid-grey caption that read at 4.8:1 on white would drop to about 3.5:1
// on a straight swap, and comes out near 5:1 instead.
const BASE = 0.2
const RANGE = 0.77

function swap(color: string, cache: Map<string, string>, curve: (inverse: number) => number) {
  const key = color.trim().toLowerCase()
  const hit = cache.get(key)
  if (hit) return hit
  const rgb = parse(key)
  if (!rgb || isBrand(key)) return color
  const [L, a, b] = toOklab(rgb)
  const mapped = toHex([BASE + curve(Math.max(0, 1 - L)) * RANGE, a, b])
  cache.set(key, mapped)
  return mapped
}

/** A background, rule or border in dark mode. Non-hex values (`transparent`) pass through. */
export function darkColor(color: string): string {
  return swap(color, fills, (t) => t)
}

const lifted = new Map<string, string>()

/** Text colour in dark mode, given the fill it sits on (if it has its own). */
export function darkText(color: string, onFill?: string): string {
  if (onFill && parse(onFill) && isBrand(onFill)) return color
  const rgb = parse(color)
  if (rgb && isBrand(color)) {
    // Brand-coloured text (a link, an accent word) keeps its hue but is lifted to
    // stay legible on the dark paper: a #2563eb link reads at 3.5:1 there, ~5.5:1
    // once raised to L 0.7.
    const key = color.trim().toLowerCase()
    const hit = lifted.get(key)
    if (hit) return hit
    const [L, a, b] = toOklab(rgb)
    const out = L >= 0.7 ? color : toHex([0.7, a, b])
    lifted.set(key, out)
    return out
  }
  return swap(color, texts, (t) => t ** 0.75)
}

/**
 * Colour helpers for one render. Light mode passes everything through; dark mode
 * maps it. The editor's canvas and the exporter both work through this.
 */
export type Ink = {
  dark: boolean
  /** A background, rule or border. */
  fill: (color: string) => string
  /** Text, optionally on a fill of its own. */
  text: (color: string, onFill?: string) => string
}

export const LIGHT_INK: Ink = { dark: false, fill: (c) => c, text: (c) => c }
export const DARK_INK: Ink = { dark: true, fill: darkColor, text: darkText }
