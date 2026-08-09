"use client"

import { motion, useReducedMotion, type Variants } from "motion/react"

import { cn } from "@/lib/utils"

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

export function Section({
  id,
  tone = "plain",
  className,
  children,
}: {
  id?: string
  tone?: "plain" | "muted"
  className?: string
  children: React.ReactNode
}) {
  const { container } = useReveal()
  return (
    <motion.section
      id={id}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      className={cn(
        "w-full min-w-0 scroll-mt-20 border-t border-border",
        tone === "muted" && "bg-muted/30",
        className,
      )}
    >
      <div className="mx-auto max-w-5xl px-5 py-20 sm:py-24">{children}</div>
    </motion.section>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  lead,
  align = "center",
  className,
}: {
  eyebrow: string
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
        align === "center" ? "mx-auto max-w-2xl items-center text-center" : "max-w-2xl items-start",
        className,
      )}
    >
      <span className="text-sm font-medium text-primary">{eyebrow}</span>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {lead && (
        <p className="mt-4 text-base text-muted-foreground text-pretty sm:text-lg">{lead}</p>
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
