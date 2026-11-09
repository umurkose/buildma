"use client"

import { motion, useReducedMotion, type Variants } from "motion/react"

import { cn } from "@/lib/utils"
import { CANDY, type Candy } from "@/components/landing/candy"

// Critically damped: a section arriving on scroll carried no gesture, so it settles
// rather than overshoots. Bounce is earned by momentum, and there is none here.
const SPRING = { type: "spring", bounce: 0, duration: 0.6 } as const

// Shared by every reveal on the page, so one scroll threshold governs all of them.
const VIEWPORT = { once: true, margin: "-80px" } as const

export function useReveal() {
  const reduce = useReducedMotion()
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.08 } },
  }
  const item: Variants = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3 } } }
    : { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: SPRING } }
  return { container, item }
}

// A panel is a full-width band until the screen is wide enough for it to float as
// a rounded block with a gutter. Its content box is the same as every plain
// section's, and its edge is drawn with an inset ring rather than a border, so
// content inside a panel lines up exactly with content outside it at every width.
export const PANEL_GUTTER = "min-[1440px]:px-4"
export const PANEL = "mx-auto max-w-[88rem] min-[1440px]:rounded-[2.75rem]"

/**
 * A page section. `surface` lifts it onto its own panel — the page is built from
 * big blocks the way an email is built from small ones.
 */
export function Section({
  id,
  surface,
  className,
  children,
}: {
  id?: string
  surface?: "card" | "ink"
  className?: string
  children: React.ReactNode
}) {
  const { container } = useReveal()
  const inner = <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">{children}</div>

  return (
    <motion.section
      id={id}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      className={cn("w-full min-w-0 scroll-mt-24", surface && PANEL_GUTTER, className)}
    >
      {surface ? (
        <div className={cn(PANEL, surface === "card" ? "bg-card ring-1 ring-border ring-inset" : "surface-ink")}>
          {inner}
        </div>
      ) : (
        inner
      )}
    </motion.section>
  )
}

/**
 * The page's one spacing scale. Every section takes its gaps from here, so the
 * rhythm stays identical from top to bottom: section padding lives in <Section>,
 * and these cover everything inside it.
 */
export const SPACE = {
  /** Section header → the content under it. */
  content: "mt-14",
  /** Between cards in any grid or list. */
  grid: "gap-4",
  /** Every card: corner and inner padding. */
  card: "rounded-[2rem] p-6",
  /** A card's picture → its text. */
  afterVisual: "mt-6",
  /** A card's title → its body. */
  body: "mt-3",
} as const

/** A candy label. */
export function Sticker({
  candy = "sun",
  className,
  children,
}: {
  candy?: Candy
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "brick inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-sm font-semibold text-ink",
        CANDY[candy].solid,
        className,
      )}
    >
      {children}
    </span>
  )
}

export function SectionHeader({
  eyebrow,
  candy = "sun",
  title,
  lead,
  align = "center",
  className,
}: {
  eyebrow: string
  candy?: Candy
  title: React.ReactNode
  lead?: React.ReactNode
  align?: "center" | "left"
  className?: string
}) {
  const { item } = useReveal()
  return (
    <motion.div
      variants={item}
      className={cn(
        "flex flex-col",
        align === "center" ? "mx-auto max-w-3xl items-center text-center" : "max-w-xl items-start",
        className,
      )}
    >
      <Sticker candy={candy}>{eyebrow}</Sticker>
      <h2 className="mt-6 font-display text-4xl leading-[1.04] font-extrabold tracking-[-0.025em] text-balance sm:text-5xl lg:text-[3.5rem]">
        {title}
      </h2>
      {lead && (
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">{lead}</p>
      )}
    </motion.div>
  )
}

export function Reveal({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { item } = useReveal()
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  )
}

// A stagger container for reveals that live OUTSIDE a <Section> — the closing CTA has
// its own <section>, so its Reveals have no parent to inherit `show` from and would
// never animate once they stopped driving themselves.
export function RevealGroup({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { container } = useReveal()
  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      className={className}
    >
      {children}
    </motion.div>
  )
}
