"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight, Mail } from "lucide-react"

import { cn } from "@/lib/utils"

const ENTRANCE = { type: "spring", bounce: 0, duration: 0.6 } as const
const MAIL_SPRING = { type: "spring", bounce: 0.35, duration: 0.45 } as const

// "emails" sits in an accent block with its mail icon. The icon opens to the left
// of the word like an accordion — its slot grows from nothing and pushes the word
// along, so the block widens with it — while the block fills in from the left and
// icon and word turn to sit on it.
function EmailsWord({ revealed, reduce }: { revealed: boolean; reduce: boolean | null }) {
  const enter = reduce ? { duration: 0.2 } : MAIL_SPRING
  const settle = revealed ? enter : { duration: 0 }
  const onBlock = cn("transition-colors delay-300 duration-300", revealed && "text-primary-foreground")
  return (
    <span className="relative inline-block px-[0.14em] whitespace-nowrap">
      <span
        aria-hidden
        className={cn(
          "brick absolute inset-x-0 top-[0.06em] -bottom-[0.06em] origin-left rounded-[0.18em] bg-primary transition-transform delay-200 duration-500 ease-out",
          revealed ? "scale-x-100" : "scale-x-0",
        )}
      />
      <motion.span
        aria-hidden
        className={cn(
          "relative inline-flex h-[0.72em] items-center overflow-hidden align-[-0.04em] text-primary",
          onBlock,
        )}
        initial={false}
        animate={{ width: revealed ? "0.72em" : "0em", marginRight: revealed ? "0.18em" : "0em" }}
        transition={settle}
      >
        <motion.span
          className="flex"
          initial={false}
          animate={{ opacity: revealed ? 1 : 0, scale: revealed || reduce ? 1 : 0.6 }}
          transition={settle}
        >
          <Mail className="size-[0.72em] shrink-0" strokeWidth={2.5} />
        </motion.span>
      </motion.span>
      <span className={cn("relative", onBlock)}>emails</span>
    </span>
  )
}

export function Hero() {
  const reduce = useReducedMotion()

  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), reduce ? 0 : 450)
    return () => clearTimeout(t)
  }, [reduce])

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.09, delayChildren: 0.05 } },
  }
  const item = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3 } } }
    : { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: ENTRANCE } }

  return (
    <section className="relative isolate overflow-x-clip">
      {/* The editor's dotted canvas, fading out toward the edges. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(var(--color-border)_1.3px,transparent_1.3px)] bg-size-[24px_24px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_42%,black,transparent)]"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[1.08fr_1fr] lg:gap-6 lg:pt-16 lg:pb-28">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="@container flex min-w-0 flex-col items-start"
        >
          {/* Sized off the column, not the viewport, so "Design emails" — icon
              included once it opens — holds one line from a phone up through the
              1024px two-column squeeze. */}
          <motion.h1
            variants={item}
            className="font-display text-[clamp(2.4rem,11cqi,5rem)] leading-[1.02] font-extrabold tracking-[-0.03em]"
          >
            <span className="block whitespace-nowrap">
              Design <EmailsWord revealed={revealed} reduce={reduce} />
            </span>{" "}
            <span className="block">for every inbox.</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-lg text-lg text-muted-foreground text-pretty sm:text-xl"
          >
            Drag, drop, and design standout emails - no code, no inbox surprises.
          </motion.p>

          <motion.div variants={item} className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/editor"
              className="group brick inline-flex h-13 items-center gap-2 rounded-full bg-primary pr-5 pl-6 text-base font-semibold text-primary-foreground transition-transform duration-200 ease-out outline-none focus-visible:ring-3 focus-visible:ring-primary/50 active:scale-[0.98] motion-safe:hover:-translate-y-0.5"
            >
              Open the editor
              <ArrowRight className="size-4.5 transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex h-13 items-center rounded-full border border-border bg-card px-6 text-base font-semibold transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-primary/50"
            >
              How it works
            </Link>
          </motion.div>
        </motion.div>

        <EmailPreview />
      </div>
    </section>
  )
}

// The hero picture: a finished email resting on two candy cards. The cards drift
// on slow, out-of-step loops and the email floats a few pixels — enough to feel
// alive, never enough to pull the eye from the headline. Reduced motion holds
// everything still.
const DRIFT = { repeat: Infinity, ease: "easeInOut" } as const

function EmailPreview() {
  const reduce = useReducedMotion()

  return (
    // Both cards reach 1.5rem past the email; on wide screens the email sits 1.5rem
    // in from the right edge, so the cards finish on the same line as the navbar
    // and every section's content.
    <div
      aria-hidden
      className="relative isolate mx-auto w-[calc(100%-3rem)] max-w-[22.5rem] select-none lg:mr-6 lg:ml-auto"
    >
      <motion.div
        className="absolute -inset-x-6 top-14 -bottom-6 -z-10 rounded-[2.5rem] bg-candy-sky/45"
        animate={reduce ? undefined : { x: [0, -10, 0], y: [0, 10, 0] }}
        transition={reduce ? undefined : { ...DRIFT, duration: 9 }}
      />
      <motion.div
        className="absolute -inset-x-6 -top-6 bottom-20 -z-10 rounded-[2.5rem] bg-candy-sun/55 dark:bg-white/[0.08]"
        animate={reduce ? undefined : { x: [0, 10, 0], y: [0, -10, 0] }}
        transition={reduce ? undefined : { ...DRIFT, duration: 11, delay: 0.6 }}
      />

      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...ENTRANCE, delay: 0.15 }}
      >
        <motion.div
          animate={reduce ? undefined : { y: [0, -8, 0] }}
          transition={reduce ? undefined : { ...DRIFT, duration: 6, delay: 0.8 }}
          className="relative rounded-[1.75rem] bg-white p-4 text-[#1c1d2e] shadow-[0_45px_80px_-40px_oklch(0_0_0/0.55),0_0_0_1px_oklch(0_0_0/0.05)]"
        >
          {/* Inbox chrome: sender and subject. */}
          <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-candy-sun text-[11px] font-bold text-ink">
              B
            </span>
            <div className="flex-1">
              <div className="h-2 w-20 rounded-full bg-neutral-300" />
              <div className="mt-1.5 h-2 w-36 rounded-full bg-neutral-200" />
            </div>
            <span className="text-[10px] text-neutral-400">9:41</span>
          </div>

          <div className="relative mt-4 h-32 overflow-hidden rounded-2xl bg-linear-to-br from-candy-sky to-[color-mix(in_oklab,var(--primary)_70%,white)]">
            <span className="absolute top-5 right-7 size-9 rounded-full bg-candy-sun" />
            <span className="absolute -bottom-12 -left-4 h-24 w-40 rounded-[2rem] bg-white/45" />
            <span className="absolute -right-6 -bottom-14 h-24 w-44 rounded-[2rem] bg-white/30" />
          </div>

          <p className="mt-5 font-display text-[1.6rem] leading-tight font-extrabold tracking-[-0.03em]">
            Welcome aboard
          </p>
          <p className="mt-2 text-[0.9rem] leading-snug text-neutral-500">
            Everything you need to get started is in one place.
          </p>
          <span className="mt-5 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
            Open the dashboard
          </span>

          <div className="mt-6 h-px bg-neutral-100" />

          <div className="mt-4 flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-5 rounded-full bg-neutral-200" />
            ))}
            <span className="ml-auto h-2 w-24 rounded-full bg-neutral-200" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
