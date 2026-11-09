"use client"

import { motion, useReducedMotion, type MotionProps, type Transition } from "motion/react"
import {
  Check,
  Copy,
  Download,
  FileCode2,
  Heading,
  Image as ImageIcon,
  MousePointer2,
  MousePointerClick,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { CAPABILITIES } from "@/components/landing/content"
import { icon as resolveIcon } from "@/components/landing/icons"
import { CANDY, cycle } from "@/components/landing/candy"
import { SPACE, Section, SectionHeader, useReveal } from "@/components/landing/section"

// A bento: wide tiles and narrow ones alternate so the rows zig-zag.
const SPAN: Record<string, string> = {
  dnd: "lg:col-span-2",
  inspector: "lg:col-span-2",
  body: "lg:col-span-2",
}

const VISUAL: Record<string, () => React.ReactNode> = {
  dnd: DndVisual,
  history: UndoVisual,
  autosave: SaveVisual,
  inspector: InspectorVisual,
  body: BodyVisual,
  export: ExportVisual,
}

const PAPER_SHADOW = "shadow-[0_12px_28px_-16px_oklch(0_0_0/0.45)]"

export function Features() {
  const { item } = useReveal()

  return (
    <Section id="features">
      <SectionHeader
        eyebrow="The editor"
        title="The details, already handled"
        lead="Undo that behaves, a draft that saves itself, and every setting in one place."
      />

      <div className={cn(SPACE.content, SPACE.grid, "grid sm:grid-cols-2 lg:grid-cols-3")}>
        {CAPABILITIES.map((capability, i) => {
          const candy = cycle(i)
          const Icon = resolveIcon(capability.icon)
          const Visual = VISUAL[capability.key]
          return (
            <motion.article
              key={capability.key}
              variants={item}
              className={cn(SPACE.card, "flex flex-col", CANDY[candy].soft, SPAN[capability.key])}
            >
              <div aria-hidden className="flex h-44 items-center justify-center select-none">
                {Visual && <Visual />}
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
                <h3 className="font-display text-xl font-bold tracking-[-0.02em]">
                  {capability.title}
                </h3>
              </div>
              <p className={cn(SPACE.body, "text-muted-foreground text-pretty")}>
                {capability.body}
              </p>
            </motion.article>
          )
        })}
      </div>
    </Section>
  )
}

// --- Tile pictures ----------------------------------------------------------
// Each one acts out its capability on a seamless loop: every keyframe track ends
// where it starts, so the repeat has no seam. Reduced motion holds one still pose.

type Frames = Record<string, (string | number)[]>

function useLoop() {
  const reduce = useReducedMotion()
  return (frames: Frames, transition: Transition, still?: Record<string, string | number>) => {
    const first = Object.fromEntries(Object.entries(frames).map(([key, values]) => [key, values[0]]))
    if (reduce) {
      const pose = still ?? first
      return { initial: pose, animate: pose } as MotionProps
    }
    return {
      initial: first,
      animate: frames,
      transition: { repeat: Infinity, ease: "easeInOut", ...transition },
    } as MotionProps
  }
}

// A block is dragged into the empty slot, rests there, and is lifted out again.
function DndVisual() {
  const loop = useLoop()
  const timing = { duration: 4.4, times: [0, 0.12, 0.42, 0.72, 1] }
  return (
    <div className="relative w-64">
      <div className={cn("rounded-2xl bg-white p-3", PAPER_SHADOW)}>
        <div className="flex h-8 items-center gap-2 rounded-lg bg-candy-sun px-2.5 text-[11px] font-semibold text-ink">
          <Heading className="size-3.5" />
          Heading
        </div>
        <div className="mt-2 h-8 rounded-lg border-2 border-dashed border-neutral-300" />
        <div className="mt-2 flex h-8 items-center gap-2 rounded-lg bg-candy-sun px-2.5 text-[11px] font-semibold text-ink">
          <MousePointerClick className="size-3.5" />
          Button
        </div>
      </div>
      <motion.div
        className="absolute top-[3.25rem] left-3 w-[14.5rem]"
        {...loop({ x: [30, 30, 0, 0, 30], y: [-16, -16, 0, 0, -16] }, timing)}
      >
        <motion.div
          className="brick flex h-8 items-center gap-2 rounded-lg bg-candy-sky px-2.5 text-[11px] font-semibold text-ink"
          {...loop({ scale: [1.04, 1.04, 1, 1, 1.04] }, timing)}
        >
          <ImageIcon className="size-3.5" />
          Image
        </motion.div>
        <MousePointer2
          className="absolute -right-2 -bottom-4 size-5 fill-ink text-white"
          strokeWidth={1.5}
        />
      </motion.div>
    </div>
  )
}

// ⌘ held, Z tapped three times: each tap clears one step of history, then redo
// fills them back in order.
const KEY_TIMES = [0, 0.11, 0.14, 0.18, 0.37, 0.4, 0.44, 0.63, 0.66, 0.7, 1]
const UNDONE: Record<number, number> = { 8: 0.14, 7: 0.4, 6: 0.66 }

function UndoVisual() {
  const loop = useLoop()
  const key =
    "brick flex size-15 items-center justify-center rounded-2xl bg-white font-display text-3xl font-bold text-ink"
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex gap-2.5">
        <motion.span
          className={key}
          {...loop({ y: [0, 3, 3, 0, 0] }, { duration: 4.8, times: [0, 0.08, 0.72, 0.76, 1] })}
        >
          ⌘
        </motion.span>
        <motion.span
          className={key}
          {...loop({ y: [0, 0, 4, 0, 0, 4, 0, 0, 4, 0, 0] }, { duration: 4.8, times: KEY_TIMES })}
        >
          Z
        </motion.span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 14 }, (_, i) => {
          const clearAt = UNDONE[i]
          if (clearAt === undefined) {
            return (
              <span
                key={i}
                className={cn("size-2 rounded-full", i < 9 ? "bg-foreground/60" : "bg-foreground/15")}
              />
            )
          }
          const refill = 0.84 + (i - 6) * 0.03
          return (
            <span key={i} className="relative size-2 rounded-full bg-foreground/15">
              <motion.span
                className="absolute inset-0 rounded-full bg-foreground/60"
                {...loop(
                  { opacity: [1, 1, 0, 0, 1, 1] },
                  {
                    duration: 4.8,
                    ease: "linear",
                    times: [0, clearAt, clearAt + 0.03, refill, refill + 0.03, 1],
                  },
                )}
              />
            </span>
          )
        })}
      </div>
    </div>
  )
}

// A line is typed and deleted again; each time the typing stops, "Saved" pops.
function SaveVisual() {
  const loop = useLoop()
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={cn("w-40 rounded-xl bg-white p-3", PAPER_SHADOW)}>
        <div className="h-2.5 w-3/4 rounded-full bg-neutral-300" />
        <div className="mt-2 h-2 w-full rounded-full bg-neutral-200" />
        <div className="mt-1.5 flex h-2 items-center">
          <motion.div
            className="h-2 rounded-full bg-neutral-200"
            {...loop(
              { width: ["0%", "80%", "80%", "0%", "0%"] },
              { duration: 5, times: [0, 0.3, 0.55, 0.8, 1] },
              { width: "80%" },
            )}
          />
          <motion.span
            className="ml-0.5 h-3 w-px bg-ink"
            {...loop({ opacity: [1, 0, 1] }, { duration: 0.9, ease: "linear" })}
          />
        </div>
        <div className="mt-3 h-6 w-20 rounded-full bg-primary" />
      </div>
      <motion.span
        className="brick inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink"
        {...loop(
          { scale: [1, 1, 1.1, 1, 1, 1.1, 1, 1] },
          { duration: 5, times: [0, 0.32, 0.36, 0.42, 0.82, 0.86, 0.92, 1] },
        )}
      >
        <span className="size-2 rounded-full bg-primary" />
        Saved
      </motion.span>
    </div>
  )
}

// Every control in the panel takes a turn: size and spacing slide, the colour
// selection walks along the swatches, alignment steps across.
const SWATCHES = ["bg-candy-sun", "bg-candy-sky", "bg-neutral-800", "bg-primary"]

function InspectorVisual() {
  const loop = useLoop()
  const row = "flex items-center justify-between gap-4 text-[10px] font-semibold text-neutral-500"
  return (
    <div className={cn("w-72 rounded-2xl bg-white p-4", PAPER_SHADOW)}>
      <div className={row}>
        <span>Colour</span>
        <span className="relative flex gap-1.5">
          {SWATCHES.map((fill) => (
            <span key={fill} className={cn("size-4 rounded-full", fill)} />
          ))}
          <motion.span
            className="absolute top-1/2 left-0 size-6 -translate-x-1 -translate-y-1/2 rounded-full ring-2 ring-neutral-800"
            {...loop(
              { x: [0, 0, 22, 22, 44, 44, 66, 66, 0] },
              { duration: 6, times: [0, 0.18, 0.25, 0.43, 0.5, 0.68, 0.75, 0.93, 1] },
            )}
          />
        </span>
      </div>
      {[
        { label: "Size", frames: ["60%", "85%", "85%", "60%", "60%"], times: [0, 0.2, 0.5, 0.7, 1] },
        { label: "Spacing", frames: ["30%", "30%", "55%", "55%", "30%"], times: [0, 0.3, 0.5, 0.8, 1] },
      ].map(({ label, frames, times }) => (
        <div key={label} className={cn(row, "mt-4")}>
          <span className="w-12 shrink-0">{label}</span>
          <span className="relative h-1.5 flex-1 rounded-full bg-neutral-200">
            <motion.span
              className="absolute inset-y-0 left-0 rounded-full bg-candy-sky"
              {...loop({ width: frames }, { duration: 6, times })}
            >
              <span className="absolute top-1/2 -right-1.5 size-3 -translate-y-1/2 rounded-full border-2 border-white bg-ink shadow-sm" />
            </motion.span>
          </span>
        </div>
      ))}
      <div className={cn(row, "mt-4")}>
        <span>Align</span>
        <span className="relative flex gap-1 rounded-md bg-neutral-100 p-0.5">
          <motion.span
            className="absolute top-0.5 left-0.5 h-4 w-6 rounded bg-white shadow-sm"
            {...loop(
              { x: [0, 0, 28, 28, 56, 56, 0, 0] },
              { duration: 6, times: [0, 0.15, 0.22, 0.48, 0.55, 0.85, 0.92, 1] },
            )}
          />
          {["w-3", "w-2", "w-3"].map((w, i) => (
            <span key={i} className="relative flex h-4 w-6 items-center justify-center">
              <span className={cn("h-0.5 rounded-full bg-neutral-400", w)} />
            </span>
          ))}
        </span>
      </div>
    </div>
  )
}

// The wall behind the email changes colour; the 600px column stays put on it.
function BodyVisual() {
  const loop = useLoop()
  return (
    <div className="brick relative flex h-40 w-72 justify-center overflow-hidden rounded-2xl bg-candy-sky pt-4">
      <motion.div
        className="absolute inset-0 bg-candy-sun"
        {...loop({ opacity: [1, 1, 0, 0, 1] }, { duration: 6, times: [0, 0.35, 0.5, 0.85, 1] })}
      />
      <div className="relative h-full w-40 rounded-t-xl bg-white p-3 shadow-[0_0_0_1px_oklch(0_0_0/0.04)]">
        <div className="h-1.5 w-2/3 rounded-full bg-neutral-200" />
        <div className="mt-3 h-3.5 w-full rounded-md bg-neutral-800/80" />
        <div className="mt-2 h-2 w-full rounded-full bg-neutral-200" />
        <div className="mt-1.5 h-2 w-4/5 rounded-full bg-neutral-200" />
        <div className="mt-3 h-6 w-16 rounded-full bg-primary" />
      </div>
    </div>
  )
}

// Download is pressed, its arrow turns into a tick, and the file arrives.
function ExportVisual() {
  const loop = useLoop()
  const swap = { duration: 4.5, times: [0, 0.26, 0.3, 0.84, 0.9, 1] }
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        className={cn("flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-ink", PAPER_SHADOW)}
        {...loop(
          { opacity: [0, 0, 1, 1, 0, 0], y: [8, 8, 0, 0, 0, 8] },
          { duration: 4.5, times: [0, 0.3, 0.4, 0.82, 0.92, 1] },
          { opacity: 1, y: 0 },
        )}
      >
        <FileCode2 className="size-4 text-neutral-500" />
        <span className="font-mono text-[11px]">launch-day.html</span>
      </motion.div>
      <div className="flex gap-2">
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-semibold text-ink shadow-[0_1px_2px_oklch(0_0_0/0.1)]">
          <Copy className="size-3.5" />
          Copy
        </span>
        <motion.span
          className="brick inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground"
          {...loop({ scale: [1, 1, 0.92, 1, 1] }, { duration: 4.5, times: [0, 0.2, 0.24, 0.3, 1] })}
        >
          <span className="relative size-3.5">
            <motion.span className="absolute inset-0" {...loop({ opacity: [1, 1, 0, 0, 1, 1] }, swap)}>
              <Download className="size-3.5" />
            </motion.span>
            <motion.span className="absolute inset-0" {...loop({ opacity: [0, 0, 1, 1, 0, 0] }, swap)}>
              <Check className="size-3.5" strokeWidth={3} />
            </motion.span>
          </span>
          Download
        </motion.span>
      </div>
    </div>
  )
}
