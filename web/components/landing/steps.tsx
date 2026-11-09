"use client"

import { motion } from "motion/react"
import {
  Blocks,
  Check,
  Download,
  Heading,
  MousePointer2,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { STEPS } from "@/components/landing/content"
import { TILE } from "@/components/landing/tiles"
import { BuilderDemo } from "@/components/landing/demo"
import { useLoop } from "@/components/landing/loop"
import { Reveal, SPACE, Section, SectionHeader, useReveal } from "@/components/landing/section"

// Each step is marked by what it does, not by a number.
const STEP_LOOK: { icon: LucideIcon; Visual: () => React.ReactNode }[] = [
  { icon: Blocks, Visual: BuildVisual },
  { icon: SlidersHorizontal, Visual: StyleVisual },
  { icon: Download, Visual: ExportVisual },
]

export function HowItWorks() {
  const { item } = useReveal()

  return (
    <Section id="how-it-works" surface="card">
      <SectionHeader
        eyebrow="How it works"
        title="From blocks to inbox in three steps"
        lead="Compose it, style it, export it. No code at any point."
      />

      <Reveal className={SPACE.content}>
        <BuilderDemo />
        <p className="mt-6 text-center text-sm text-muted-foreground text-pretty">
          A recording of the editor. Your own work saves to your browser as you go — no
          account, no save button.
        </p>
      </Reveal>

      <ol className={cn(SPACE.content, SPACE.grid, "grid lg:grid-cols-3")}>
        {STEPS.map((step, i) => {
          const { icon: Icon, Visual } = STEP_LOOK[i % STEP_LOOK.length]
          return (
            <motion.li
              key={step.key}
              variants={item}
              className={cn(SPACE.card, "flex flex-col border border-border bg-card")}
            >
              {/* A little stage with the editor's dotted canvas, where the step plays. */}
              <div
                aria-hidden
                className="flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-muted/60 bg-[radial-gradient(color-mix(in_oklab,var(--color-foreground)_11%,transparent)_1px,transparent_1px)] bg-size-[14px_14px] select-none"
              >
                <Visual />
              </div>
              <div className={cn(SPACE.afterVisual, "flex items-center gap-3")}>
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    TILE,
                  )}
                >
                  <Icon className="size-4.5" />
                </span>
                <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  {step.label}
                </span>
              </div>
              <h3 className="mt-4 text-2xl leading-tight font-semibold tracking-tight text-balance">
                {step.title}
              </h3>
              <p className={cn(SPACE.body, "text-muted-foreground text-pretty")}>{step.body}</p>
            </motion.li>
          )
        })}
      </ol>
    </Section>
  )
}

// --- Step pictures ----------------------------------------------------------
// Decorative, each acting out its step on a seamless loop (see useLoop). Reduced
// motion holds one still pose.

const PAPER_SHADOW = "shadow-[0_12px_28px_-16px_oklch(0_0_0/0.45),0_0_0_1px_oklch(0_0_0/0.06)]"

// The block drops into the empty slot, sits there, and is lifted out again.
function BuildVisual() {
  const loop = useLoop()
  const timing = { duration: 4.4, times: [0, 0.15, 0.45, 0.75, 1] }
  return (
    <div className="relative h-32 w-44">
      <div className={cn("absolute inset-x-0 bottom-0 rounded-xl bg-white p-2.5", PAPER_SHADOW)}>
        <div className="h-2.5 w-3/4 rounded-full bg-neutral-200" />
        <div className="mt-1.5 h-2.5 w-1/2 rounded-full bg-neutral-200" />
        <div className="relative mt-3 h-8 rounded-lg border-2 border-dashed border-neutral-300">
          <motion.span
            className="absolute -inset-0.5 rounded-lg border-2 border-dashed border-primary"
            {...loop(
              { opacity: [0, 0, 1, 0, 0, 0] },
              { duration: 4.4, times: [0, 0.12, 0.36, 0.45, 0.75, 1] },
            )}
          />
        </div>
      </div>
      <motion.div
        className="absolute top-0 left-5"
        {...loop({ x: [0, 0, -4, -4, 0], y: [0, 0, 86, 86, 0] }, timing)}
      >
        <motion.div
          className="brick flex h-8 w-36 items-center gap-1.5 rounded-lg bg-primary px-2 text-[11px] font-semibold text-primary-foreground"
          {...loop({ scale: [1.05, 1.05, 1, 1, 1.05] }, timing)}
        >
          <Heading className="size-3.5" />
          Heading
        </motion.div>
        <MousePointer2
          className="absolute -right-3 -bottom-4 size-5 fill-neutral-900 text-white"
          strokeWidth={1.5}
        />
      </motion.div>
    </div>
  )
}

// The radius slider rounds the button off, a swatch recolours it, then both reset.
const STYLE_TIMES = [0, 0.15, 0.3, 0.4, 0.5, 0.8, 0.95, 1]
const SWATCHES = ["bg-neutral-300", "bg-neutral-500", "bg-neutral-800", "bg-primary"]

function StyleVisual() {
  const loop = useLoop()
  const timing = { duration: 6, times: STYLE_TIMES }
  return (
    <div className="flex w-48 flex-col items-center gap-3">
      <motion.span
        className="relative inline-flex h-9 items-center overflow-hidden bg-primary px-5 text-[11px] font-semibold text-primary-foreground"
        {...loop({ borderRadius: [18, 18, 6, 6, 6, 6, 18, 18] }, timing)}
      >
        <motion.span
          className="absolute inset-0 bg-neutral-900"
          {...loop({ opacity: [0, 0, 0, 0, 1, 1, 0, 0] }, timing)}
        />
        <span className="relative text-white">Read the update</span>
      </motion.span>
      <div className={cn("w-full rounded-xl bg-white p-3 text-neutral-500", PAPER_SHADOW)}>
        <div className="flex items-center justify-between text-[9px] font-semibold">
          <span>Radius</span>
          <span className="relative text-neutral-800 tabular-nums">
            <motion.span {...loop({ opacity: [1, 1, 0, 0, 0, 0, 1, 1] }, timing)}>100%</motion.span>
            <motion.span
              className="absolute right-0"
              {...loop({ opacity: [0, 0, 1, 1, 1, 1, 0, 0] }, timing)}
            >
              20%
            </motion.span>
          </span>
        </div>
        <div className="relative mt-2 h-1.5 rounded-full bg-neutral-200">
          <motion.span
            className="absolute inset-y-0 left-0 rounded-full bg-primary/70"
            {...loop(
              { width: ["100%", "100%", "20%", "20%", "20%", "20%", "100%", "100%"] },
              timing,
            )}
          >
            <span className="absolute top-1/2 -right-1.5 size-3 -translate-y-1/2 rounded-full border-2 border-white bg-neutral-900 shadow-sm" />
          </motion.span>
        </div>
        <div className="relative mt-3 flex items-center gap-2.5">
          {SWATCHES.map((fill) => (
            <span key={fill} className={cn("size-4 rounded-full", fill)} />
          ))}
          <motion.span
            className="absolute top-1/2 left-0 size-6 -translate-x-1 -translate-y-1/2 rounded-full ring-2 ring-neutral-800"
            {...loop({ x: [78, 78, 78, 78, 52, 52, 78, 78] }, timing)}
          />
        </div>
      </div>
    </div>
  )
}

// Download is pressed, the arrow turns into a tick, and the file lifts off.
function ExportVisual() {
  const loop = useLoop()
  const swap = { duration: 4.5, times: [0, 0.26, 0.3, 0.84, 0.9, 1] }
  return (
    <div className="relative">
      <motion.div
        className="brick flex h-28 w-24 flex-col rounded-xl bg-white p-2.5"
        {...loop({ y: [0, 0, -8, -8, 0, 0] }, { duration: 4.5, times: [0, 0.28, 0.4, 0.84, 0.94, 1] })}
      >
        <span className="h-1.5 w-3/4 rounded-full bg-primary/40" />
        <span className="mt-1.5 h-1.5 w-1/2 rounded-full bg-primary/20" />
        <span className="mt-1.5 h-1.5 w-2/3 rounded-full bg-neutral-200" />
        <span className="mt-1.5 h-1.5 w-2/5 rounded-full bg-neutral-200" />
        <motion.span
          className="mt-auto self-start rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary"
          {...loop(
            { scale: [1, 1, 1.18, 1, 1, 1] },
            { duration: 4.5, times: [0, 0.3, 0.36, 0.44, 0.9, 1] },
          )}
        >
          .html
        </motion.span>
      </motion.div>
      <motion.span
        className="brick absolute -right-5 -bottom-3 flex size-11 items-center justify-center overflow-hidden rounded-full bg-neutral-900 text-white"
        {...loop({ scale: [1, 1, 0.88, 1, 1] }, { duration: 4.5, times: [0, 0.2, 0.25, 0.32, 1] })}
      >
        <motion.span className="absolute inset-0 bg-primary" {...loop({ opacity: [0, 0, 1, 1, 0, 0] }, swap)} />
        <motion.span className="absolute" {...loop({ opacity: [1, 1, 0, 0, 1, 1] }, swap)}>
          <Download className="size-5" />
        </motion.span>
        <motion.span className="absolute" {...loop({ opacity: [0, 0, 1, 1, 0, 0] }, swap)}>
          <Check className="size-5" strokeWidth={3} />
        </motion.span>
      </motion.span>
    </div>
  )
}
