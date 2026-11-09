"use client"

import { motion } from "motion/react"
import {
  Blocks,
  Download,
  Heading,
  MousePointer2,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { STEPS } from "@/components/landing/content"
import { CANDY, type Candy } from "@/components/landing/candy"
import { BuilderDemo } from "@/components/landing/demo"
import { Reveal, SPACE, Section, SectionHeader, useReveal } from "@/components/landing/section"

// Each step is marked by what it does, not by a number.
const STEP_LOOK: { candy: Candy; icon: LucideIcon; Visual: () => React.ReactNode }[] = [
  { candy: "sun", icon: Blocks, Visual: BuildVisual },
  { candy: "sky", icon: SlidersHorizontal, Visual: StyleVisual },
  { candy: "sun", icon: Download, Visual: ExportVisual },
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
          const { candy, icon: Icon, Visual } = STEP_LOOK[i % STEP_LOOK.length]
          return (
            <motion.li
              key={step.key}
              variants={item}
              className={cn(SPACE.card, "group flex flex-col", CANDY[candy].soft)}
            >
              <div aria-hidden className="flex h-44 items-center justify-center select-none">
                <Visual />
              </div>
              <div className={cn(SPACE.afterVisual, "flex items-center gap-3")}>
                <span
                  className={cn(
                    "brick flex size-9 shrink-0 items-center justify-center rounded-xl text-ink",
                    CANDY[candy].solid,
                  )}
                >
                  <Icon className="size-4.5" />
                </span>
                <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  {step.label}
                </span>
              </div>
              <h3 className="mt-4 font-display text-2xl leading-tight font-bold tracking-[-0.025em] text-balance">
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
// Small, static and decorative. Hovering a card plays its step once: the block
// drops into its slot, the button's corners change, the file lifts.

const PAPER_SHADOW = "shadow-[0_12px_28px_-16px_oklch(0_0_0/0.45)]"

function BuildVisual() {
  return (
    <div className="relative h-32 w-44">
      <div className={cn("absolute inset-x-0 bottom-0 rounded-xl bg-white p-2.5", PAPER_SHADOW)}>
        <div className="h-2.5 w-3/4 rounded-full bg-neutral-200" />
        <div className="mt-1.5 h-2.5 w-1/2 rounded-full bg-neutral-200" />
        <div className="mt-3 h-8 rounded-lg border-2 border-dashed border-neutral-300" />
      </div>
      <div className="absolute top-0 left-5 transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-safe:group-hover:translate-x-[-0.25rem] motion-safe:group-hover:translate-y-[5.375rem]">
        <div className="brick flex h-8 w-36 items-center gap-1.5 rounded-lg bg-candy-sun px-2 text-[11px] font-semibold text-ink">
          <Heading className="size-3.5" />
          Heading
        </div>
        <MousePointer2
          className="absolute -right-3 -bottom-4 size-5 fill-ink text-white"
          strokeWidth={1.5}
        />
      </div>
    </div>
  )
}

function StyleVisual() {
  return (
    <div className="flex w-48 flex-col items-center gap-3">
      <span className="inline-flex h-9 items-center rounded-full bg-primary px-5 text-[11px] font-semibold text-primary-foreground transition-[border-radius] duration-500 group-hover:rounded-md">
        Read the update
      </span>
      <div className={cn("w-full rounded-xl bg-white p-3 text-neutral-500", PAPER_SHADOW)}>
        <div className="flex items-center justify-between text-[9px] font-semibold">
          <span>Radius</span>
          <span className="text-neutral-800 tabular-nums">
            <span className="group-hover:hidden">100%</span>
            <span className="hidden group-hover:inline">20%</span>
          </span>
        </div>
        <div className="relative mt-2 h-1.5 rounded-full bg-neutral-200">
          <div className="absolute inset-y-0 left-0 w-full rounded-full bg-candy-sky transition-[width] duration-500 group-hover:w-1/5" />
          <span className="absolute top-1/2 left-full size-3 -translate-1/2 rounded-full border-2 border-white bg-ink shadow-sm transition-[left] duration-500 group-hover:left-1/5" />
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {["bg-candy-sun", "bg-candy-sky", "bg-neutral-800"].map((fill) => (
            <span key={fill} className={cn("size-4 rounded-full", fill)} />
          ))}
          <span className="size-4 rounded-full bg-primary ring-2 ring-primary/30 ring-offset-1 ring-offset-white" />
        </div>
      </div>
    </div>
  )
}

function ExportVisual() {
  return (
    <div className="relative">
      <div className="brick flex h-28 w-24 flex-col rounded-xl bg-white p-2.5 transition-transform duration-500 motion-safe:group-hover:-translate-y-1.5">
        <span className="h-1.5 w-3/4 rounded-full bg-candy-sky" />
        <span className="mt-1.5 h-1.5 w-1/2 rounded-full bg-candy-sun" />
        <span className="mt-1.5 h-1.5 w-2/3 rounded-full bg-neutral-200" />
        <span className="mt-1.5 h-1.5 w-2/5 rounded-full bg-neutral-200" />
        <span className="mt-auto self-start rounded-md bg-candy-sun px-1.5 py-0.5 text-[10px] font-bold text-ink">
          .html
        </span>
      </div>
      <span className="brick absolute -right-5 -bottom-3 flex size-11 items-center justify-center rounded-full bg-ink text-white transition-colors duration-300 group-hover:bg-candy-sun group-hover:text-ink">
        <Download className="size-5" />
      </span>
    </div>
  )
}
