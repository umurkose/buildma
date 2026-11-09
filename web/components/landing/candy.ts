// Candy colours for the landing page — deliberately just two, so the page stays
// calm: `sun` is the brand yellow, `sky` a light tint of the accent (blue unless
// the reader picked another accent). Editor palette groups alternate between them
// (PALETTE_GROUPS in components/builder/store.ts), so blocks still read as grouped.
//
// Classes are written out in full so Tailwind can see every one of them.

export type Candy = "sun" | "sky"

export const CANDY: Record<
  Candy,
  {
    /** The block fill. Text on it is always `text-ink`. */
    solid: string
    /** A light wash for chips and small surfaces. */
    tint: string
    /** A barely-there wash for large panels. */
    soft: string
    /** An open accordion item. */
    open: string
  }
> = {
  // Translucent yellow over a dark page mixes to olive, so in dark mode the washes
  // turn neutral and yellow stays on solid fills only.
  sun: {
    solid: "bg-candy-sun",
    tint: "bg-candy-sun/30 dark:bg-white/10",
    soft: "bg-candy-sun/20 dark:bg-white/[0.06]",
    open: "data-[state=open]:bg-candy-sun/25 dark:data-[state=open]:bg-white/[0.07]",
  },
  sky: {
    solid: "bg-candy-sky",
    tint: "bg-candy-sky/30",
    soft: "bg-candy-sky/20",
    open: "data-[state=open]:bg-candy-sky/25",
  },
}

/** For lists with no grouping of their own — items alternate. */
export const cycle = (index: number): Candy => (index % 2 === 0 ? "sun" : "sky")

export const BLOCK_GROUPS: { key: string; label: string; candy: Candy; blocks: string[] }[] = [
  {
    key: "text",
    label: "Text",
    candy: "sun",
    blocks: ["heading", "text", "richtext", "list", "quote", "callout"],
  },
  { key: "media", label: "Media", candy: "sky", blocks: ["image", "table"] },
  { key: "layout", label: "Layout", candy: "sun", blocks: ["columns", "divider", "spacer"] },
  { key: "actions", label: "Actions", candy: "sky", blocks: ["button", "menu", "social"] },
]

export const candyOf = (blockKey: string): Candy =>
  BLOCK_GROUPS.find((group) => group.blocks.includes(blockKey))?.candy ?? "sun"
