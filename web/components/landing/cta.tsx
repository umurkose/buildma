"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import {
  ArrowRight,
  Columns2,
  Heading,
  Image as ImageIcon,
  MousePointerClick,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { PANEL, PANEL_GUTTER, Reveal, RevealGroup } from "@/components/landing/section"

// Blocks drifting around the edges of the panel — white and the accent tint, the
// only two fills that read on the yellow. The lower pair only appears where there
// is room for it beside the copy.
const FLOATERS: { label: string; icon: LucideIcon; fill: string; place: string }[] = [
  { label: "Heading", icon: Heading, fill: "bg-white", place: "top-4 left-[5%] sm:top-10" },
  { label: "Image", icon: ImageIcon, fill: "bg-candy-sky", place: "top-4 right-[5%] sm:top-10" },
  { label: "Button", icon: MousePointerClick, fill: "bg-candy-sky", place: "bottom-12 left-[7%] hidden lg:flex" },
  { label: "Columns", icon: Columns2, fill: "bg-white", place: "bottom-10 right-[7%] hidden lg:flex" },
]

export function FinalCta() {
  const reduce = useReducedMotion()

  return (
    <section className={cn("w-full min-w-0", PANEL_GUTTER)}>
      <div
        className={cn(
          PANEL,
          "relative isolate overflow-hidden bg-candy-sun px-4 py-20 text-ink sm:px-6 sm:py-28",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(oklch(0_0_0/0.09)_1.3px,transparent_1.3px)] bg-size-[22px_22px]"
        />

        {FLOATERS.map(({ label, icon: Icon, fill, place }, i) => (
          <motion.span
            key={label}
            aria-hidden
            className={cn(
              "brick absolute flex items-center gap-2 rounded-2xl py-2 pr-4 pl-2 text-base font-semibold text-ink select-none",
              fill,
              place,
            )}
            animate={reduce ? undefined : { y: [0, -8, 0] }}
            transition={
              reduce
                ? undefined
                : { duration: 5 + i * 0.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }
            }
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-candy-sun/60">
              <Icon className="size-4.5" />
            </span>
            {label}
          </motion.span>
        ))}

        <RevealGroup className="relative mx-auto max-w-5xl">
          <Reveal>
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <h2 className="font-display text-5xl leading-[0.98] font-extrabold tracking-[-0.03em] text-balance sm:text-6xl lg:text-7xl">
                Your next email is a few blocks away
              </h2>
              <p className="mt-6 max-w-xl text-lg text-ink/75 text-pretty">
                Open a blank canvas and export the HTML when it looks right. Nothing to
                install, nothing to sign up for.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/editor"
                  className="group brick inline-flex h-13 items-center gap-2 rounded-full bg-ink pr-5 pl-6 text-base font-semibold text-white transition-transform duration-200 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ink/40 active:scale-[0.98] motion-safe:hover:-translate-y-0.5"
                >
                  Start building — it&apos;s free
                  <ArrowRight className="size-4.5 transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="#blocks"
                  className="inline-flex h-13 items-center rounded-full border-2 border-ink/80 px-6 text-base font-semibold transition-colors outline-none hover:bg-ink/10 focus-visible:ring-3 focus-visible:ring-ink/40"
                >
                  Blocks
                </Link>
              </div>
              <p className="mt-8 text-sm text-ink/70">
                No account · No credit card · Your draft stays in your browser
              </p>
            </div>
          </Reveal>
        </RevealGroup>
      </div>
    </section>
  )
}
