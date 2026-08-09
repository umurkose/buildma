"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  Copy,
  Download,
  GripVertical,
  Heading,
  Image as ImageIcon,
  ImageOff,
  List,
  Mail,
  Minus,
  Monitor,
  MousePointerClick,
  Redo2,
  Smartphone,
  Type,
  Undo2,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Marquee } from "@/components/ui/marquee"
import { PROOFS } from "@/components/landing/content"
import { icon as resolveIcon } from "@/components/landing/icons"

const ENTRANCE = { type: "spring", bounce: 0, duration: 0.6 } as const
const MAIL_SPRING = { type: "spring", bounce: 0.35, duration: 0.45 } as const

function EmailsWord({ revealed, reduce }: { revealed: boolean; reduce: boolean | null }) {
  const enter = reduce ? { duration: 0.2 } : MAIL_SPRING
  const settle = revealed ? enter : { duration: 0 }
  const tilt = revealed
    ? reduce
      ? { duration: 0.2 }
      : ({ type: "spring", bounce: 0.4, duration: 0.5, delay: 0.2 } as const)
    : { duration: 0 }
  return (
    <span className="whitespace-nowrap">
      <motion.span
        aria-hidden
        className="inline-flex h-[0.82em] items-center overflow-hidden align-[-0.12em] text-primary"
        initial={false}
        animate={{ width: revealed ? "0.82em" : "0em", marginRight: revealed ? "0.16em" : "0em" }}
        transition={settle}
      >
        <motion.span
          className="flex"
          initial={false}
          animate={{
            opacity: revealed ? 1 : 0,
            scale: revealed || reduce ? 1 : 0.6,
            rotate: revealed && !reduce ? -9 : 0,
          }}
          transition={{ default: settle, rotate: tilt }}
        >
          <Mail className="size-[0.82em] shrink-0" strokeWidth={2.25} />
        </motion.span>
      </motion.span>
      <span className="relative inline-block">
        <span className={cn("transition-colors delay-200 duration-500", revealed && "text-primary")}>
          emails
        </span>
        <span
          aria-hidden
          className={cn(
            "absolute -bottom-1 left-0 h-1 w-full origin-left rounded-full bg-primary transition-transform delay-200 duration-500",
            revealed ? "scale-x-100" : "scale-x-0",
          )}
        />
      </span>
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
    : { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: ENTRANCE } }

  return (
    <section className="relative mx-auto flex w-full min-w-0 max-w-5xl flex-col items-center gap-8 px-5 pt-10 pb-16 text-center lg:pt-16 lg:pb-24">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex w-full max-w-3xl flex-col items-center gap-6"
      >
        <motion.h1
          variants={item}
          className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
        >
          <span className="block whitespace-nowrap">
            Design <EmailsWord revealed={revealed} reduce={reduce} />
          </span>{" "}
          for every inbox.
        </motion.h1>
        <motion.p
          variants={item}
          className="max-w-xl text-base text-muted-foreground text-pretty sm:text-lg"
        >
          Drag, drop, and design standout emails - no code, no inbox surprises.
        </motion.p>
        <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/editor" className="group">
              Open the editor
              <ArrowRight
                data-icon="inline-end"
                className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
              />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#how-it-works">How it works</Link>
          </Button>
        </motion.div>

        <motion.div variants={item} className="relative mt-2 w-full max-w-xl">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-background to-background/0" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-background to-background/0" />
          <Marquee pauseOnHover className="[--duration:28s] [--gap:2rem]">
            {PROOFS.map(({ icon: name, label }) => {
              const Icon = resolveIcon(name)
              return (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
                >
                  <Icon className="size-4 text-primary" />
                  {label}
                </span>
              )
            })}
          </Marquee>
        </motion.div>
      </motion.div>

      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...ENTRANCE, delay: 0.15 }}
        className="w-full"
      >
        <BuilderDemo />
        <p className="mt-4 text-sm text-muted-foreground">
          A recording of the editor. Your own work saves to your browser as you go — no
          account, no save button.
        </p>
      </motion.div>
    </section>
  )
}

const GUTTER = 13
const GUTTER_PX = 24
const PAPER = 340

type Kind = "heading" | "text" | "image" | "button" | "list" | "divider"

type DemoBlock = {
  id: string
  kind: Kind
  text?: string
  size?: number
  spacing: number
  weight?: number
  align?: "left" | "center"
  muted?: boolean
  accent?: boolean
  tracked?: boolean
}

const META: Record<Kind, { icon: LucideIcon; label: string }> = {
  heading: { icon: Heading, label: "Heading" },
  text: { icon: Type, label: "Text" },
  list: { icon: List, label: "List" },
  image: { icon: ImageIcon, label: "Image" },
  divider: { icon: Minus, label: "Divider" },
  button: { icon: MousePointerClick, label: "Button" },
}

const GROUPS: { label: string; kinds: Kind[] }[] = [
  { label: "Text", kinds: ["heading", "text", "list"] },
  { label: "Media", kinds: ["image"] },
  { label: "Layout", kinds: ["divider"] },
  { label: "Actions", kinds: ["button"] },
]

type Step = { add: DemoBlock } | { edit: string; patch: Partial<DemoBlock> }
type Scene = { name: string; steps: Step[] }

const SCENES: Scene[] = [
  {
    name: "Welcome",
    steps: [
      { add: { id: "w-img", kind: "image", spacing: 16 } },
      { add: { id: "w-h", kind: "heading", text: "Welcome aboard", size: 26, weight: 700, spacing: 12 } },
      {
        add: {
          id: "w-t",
          kind: "text",
          text: "Everything you need to get started is in one place.",
          size: 15,
          spacing: 10,
          muted: true,
        },
      },
      { add: { id: "w-b", kind: "button", text: "Open the dashboard", size: 15, spacing: 16 } },
    ],
  },
  {
    name: "Verify",
    steps: [
      { add: { id: "v-h", kind: "heading", text: "Confirm your email", size: 24, weight: 700, spacing: 12 } },
      {
        add: {
          id: "v-t",
          kind: "text",
          text: "Enter this code to finish signing in.",
          size: 15,
          spacing: 8,
          muted: true,
        },
      },
      { add: { id: "v-c", kind: "heading", text: "418 302", size: 34, weight: 700, spacing: 18, align: "center", accent: true, tracked: true } },
      { add: { id: "v-n", kind: "text", text: "It expires in 10 minutes.", size: 13, spacing: 8, align: "center", muted: true } },
    ],
  },
  {
    name: "Digest",
    steps: [
      { add: { id: "d-h", kind: "heading", text: "This week in design", size: 24, weight: 700, spacing: 12 } },
      {
        add: {
          id: "d-l",
          kind: "list",
          text: "Designing calmer interfaces\nThe case for boring technology\nType that scales with the reader",
          size: 15,
          spacing: 12,
          muted: true,
        },
      },
      { add: { id: "d-d", kind: "divider", spacing: 12 } },
      { add: { id: "d-b", kind: "button", text: "Read on the web", size: 15, spacing: 12 } },
    ],
  },
]

function finalBlocks(scene: Scene): DemoBlock[] {
  let out: DemoBlock[] = []
  for (const step of scene.steps) {
    if ("add" in step) out = [...out, step.add]
    else out = out.map((b) => (b.id === step.edit ? { ...b, ...step.patch } : b))
  }
  return out
}

const MOVE = { type: "spring", bounce: 0, duration: 0.4 } as const
const LAND = { type: "spring", bounce: 0.2, duration: 0.42 } as const
const FLIGHT = { type: "spring", bounce: 0, duration: 0.5 } as const

type Ghost = { kind: Kind; sx: number; sy: number; ex: number; ey: number; w: number }

function BuilderDemo() {
  const reduce = useReducedMotion()
  const [state, setState] = useState<{ scene: number; blocks: DemoBlock[]; selectedId: string | null }>(
    { scene: 0, blocks: [], selectedId: null },
  )
  const [ghost, setGhost] = useState<Ghost | null>(null)
  const [pending, setPending] = useState<Kind | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reduce) return
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const wait = (ms: number) => new Promise<void>((r) => timers.push(setTimeout(r, ms)))

    const measure = (kind: Kind): Ghost | null => {
      const box = containerRef.current
      const paper = paperRef.current
      if (!box || !paper) return null
      const card = box.querySelector<HTMLElement>(`[data-card="${kind}"]`)
      if (!card) return null
      const b = box.getBoundingClientRect()
      const c = card.getBoundingClientRect()
      const pr = paper.getBoundingClientRect()
      // A real row, not whatever is last: on an empty paper that is the placeholder
      // card, and aiming at its bottom put the ghost ~110px below the block it becomes.
      const last = paper.querySelector<HTMLElement>("[data-row]:last-of-type")
      const bottom = last ? last.getBoundingClientRect().bottom : pr.top + 8
      return {
        kind,
        sx: c.left - b.left + c.width / 2,
        sy: c.top - b.top + c.height / 2,
        ex: pr.left - b.left + pr.width / 2,
        ey: Math.min(bottom - b.top + 16, pr.bottom - b.top - 14),
        w: Math.max(110, pr.width - GUTTER * 2),
      }
    }

    ;(async () => {
      let i = 0
      while (!cancelled) {
        setState({ scene: i, blocks: [], selectedId: null })
        setGhost(null)
        setPending(null)
        await wait(520)
        let blocks: DemoBlock[] = []
        for (const step of SCENES[i].steps) {
          if (cancelled) break
          if ("add" in step) {
            setPending(step.add.kind)
            await wait(230)
            if (cancelled) break
            const g = measure(step.add.kind)
            if (g) setGhost(g)
            await wait(g ? 680 : 120)
            if (cancelled) break
            blocks = [...blocks, step.add]
            setState({ scene: i, blocks, selectedId: step.add.id })
            setPending(null)
            await wait(g ? 220 : 0)
            setGhost(null)
            await wait(340)
          } else {
            blocks = blocks.map((b) => (b.id === step.edit ? { ...b, ...step.patch } : b))
            setState({ scene: i, blocks, selectedId: step.edit })
            await wait(900)
          }
        }
        await wait(1700)
        setState({ scene: i, blocks: [], selectedId: null })
        setGhost(null)
        setPending(null)
        await wait(540)
        i = (i + 1) % SCENES.length
      }
    })()

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [reduce])

  const scene = SCENES[state.scene]
  const blocks = reduce ? finalBlocks(scene) : state.blocks
  const selectedId = reduce ? (blocks.length ? blocks[blocks.length - 1].id : null) : state.selectedId
  const active = blocks.find((b) => b.id === selectedId) ?? null
  const lit = pending

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-border bg-card text-left"
    >
      <DemoTopbar />

      <div className="grid h-110 grid-cols-[132px_1fr] sm:grid-cols-[176px_1fr_176px]">
        <DemoPalette lit={lit} pending={pending} />
        <DemoCanvas paperRef={paperRef} blocks={blocks} selectedId={selectedId} />
        <DemoInspector active={active} />
      </div>

      {ghost && !reduce && <GhostBlock ghost={ghost} />}
    </div>
  )
}

function DemoTopbar() {
  const rule = <span className="mx-1 h-4 w-px shrink-0 self-center bg-border" />
  return (
    <div className="flex h-11 items-center gap-1 border-b border-border px-2.5">
      <span className="flex size-6 items-center justify-center rounded-md text-muted-foreground">
        <ChevronLeft className="size-3.5" />
      </span>
      <span className="mr-auto truncate text-[11px] font-medium">Email Editor</span>

      <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Monitor className="size-3.5" />
      </span>
      <span className="flex size-6 items-center justify-center rounded-md text-muted-foreground">
        <Smartphone className="size-3.5" />
      </span>
      {rule}
      <span className="flex size-6 items-center justify-center rounded-md text-muted-foreground/45">
        <Undo2 className="size-3.5" />
      </span>
      <span className="hidden size-6 items-center justify-center rounded-md text-muted-foreground/45 sm:flex">
        <Redo2 className="size-3.5" />
      </span>
      {rule}
      <span className="hidden h-6 items-center gap-1 rounded-md px-1.5 text-[10px] font-medium sm:flex">
        <Copy className="size-3" />
        Copy
      </span>
      <span className="flex h-6 items-center gap-1 rounded-md bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
        <Download className="size-3" />
        Download
      </span>
    </div>
  )
}

function DemoPalette({ lit, pending }: { lit: Kind | null; pending: Kind | null }) {
  return (
    <div className="flex flex-col gap-1 overflow-hidden border-r border-border p-2">
      {GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1.5 pb-1">
          <span className="px-1 pt-1 text-[10px] font-medium text-sidebar-foreground/70">
            {group.label}
          </span>
          {group.kinds.map((kind) => {
            const Icon = META[kind].icon
            const on = lit === kind
            return (
              <motion.div
                key={kind}
                data-card={kind}
                animate={{ scale: pending === kind ? 0.96 : 1 }}
                transition={MOVE}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-colors duration-200",
                  on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                    on ? "bg-white/20 text-primary-foreground" : "text-primary",
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <span className="flex-1 truncate text-[10px] font-semibold">{META[kind].label}</span>
                <GripVertical
                  className={cn(
                    "size-3 shrink-0",
                    on ? "text-primary-foreground/70" : "text-muted-foreground/50",
                  )}
                />
              </motion.div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function DemoCanvas({
  paperRef,
  blocks,
  selectedId,
}: {
  paperRef: React.RefObject<HTMLDivElement | null>
  blocks: DemoBlock[]
  selectedId: string | null
}) {
  return (
    <div className="overflow-hidden bg-muted/40 bg-[radial-gradient(color-mix(in_oklab,var(--color-foreground)_12%,transparent)_1px,transparent_1px)] bg-size-[14px_14px] dark:bg-neutral-900!">
      <div className="mx-auto flex h-full flex-col p-4" style={{ maxWidth: PAPER + 36 }}>
        <div
          ref={paperRef}
          className={cn(
            "relative mx-auto w-full overflow-hidden",
            blocks.length === 0 ? "border border-dashed border-border bg-background" : "bg-white",
          )}
          style={{ maxWidth: PAPER }}
        >
          {/* AnimatePresence wraps BOTH branches, not just the populated one.
              Inside the ternary it was unmounting ITSELF on reset, and a component can
              only animate children out while it stays mounted — so every ~8.6s the
              finished email vanished between two frames instead of leaving the way it
              arrived. The placeholder gets a stable key and its own exit so it takes
              part in the same handover rather than snapping in underneath.

              No `initial={false}`: the demo starts empty, so every block IS new, and
              suppressing the first one's entrance robbed exactly the block the ghost
              flies in to hand off to — the one arrival the whole demo is built around. */}
          <AnimatePresence mode="popLayout">
            {blocks.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col items-center gap-1.5 px-4 py-8 text-center"
              >
                <span className="-rotate-6 text-primary">
                  <Mail className="size-7" />
                </span>
                <span className="text-[11px] font-medium">Your email is empty</span>
                <span className="max-w-40 text-[9px] leading-snug text-muted-foreground">
                  Add a block from the palette on the left to start designing.
                </span>
              </motion.div>
            ) : (
              blocks.map((block) => (
                <DemoRow key={block.id} block={block} selected={block.id === selectedId} />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function DemoRow({ block, selected }: { block: DemoBlock; selected: boolean }) {
  const enter =
    block.kind === "button"
      ? { initial: { opacity: 0, scale: 0.94 }, transition: LAND }
      : block.kind === "image"
        ? { initial: { opacity: 0, scale: 0.97, y: 6 }, transition: LAND }
        : { initial: { opacity: 0, y: 8 }, transition: MOVE }

  return (
    <motion.div
      layout
      initial={enter.initial}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6 }}
      transition={enter.transition}
      data-row
      className="relative"
      style={{ padding: `${block.spacing}px ${GUTTER}px` }}
    >
      <DemoBlockBody block={block} />

      {selected && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute z-20 border border-dashed border-primary"
            style={{ inset: `${block.spacing}px ${GUTTER}px` }}
          />
          {[
            ["top", "left"],
            ["top", "right"],
            ["bottom", "left"],
            ["bottom", "right"],
          ].map(([v, h]) => (
            <span
              key={`${v}${h}`}
              aria-hidden
              className="pointer-events-none absolute z-20 size-1.5 rounded-[1px] border border-primary bg-background"
              style={{ [v]: block.spacing - 3, [h]: GUTTER - 3 } as React.CSSProperties}
            />
          ))}
          <span
            aria-hidden
            className="pointer-events-none absolute z-20 rounded-xs bg-primary px-1 text-[8px] leading-3 font-medium text-primary-foreground"
            style={{ top: block.spacing - 14, left: GUTTER }}
          >
            {META[block.kind].label}
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute z-20 flex items-stretch overflow-hidden rounded-xs bg-primary text-[8px] leading-3 font-medium text-primary-foreground"
            style={{ top: block.spacing - 14, right: GUTTER }}
          >
            <span className="flex items-center gap-0.5 px-1">
              <span className="opacity-60">W</span>
              <span className="tabular-nums">600</span>
            </span>
            {block.size && (
              <span className="flex items-center gap-0.5 border-l border-primary-foreground/25 px-1">
                <span className="opacity-60">Size</span>
                <span className="tabular-nums">{block.size}</span>
              </span>
            )}
            <span className="flex items-center gap-0.5 border-l border-primary-foreground/25 px-1">
              <span className="opacity-60">Spacing</span>
              <span className="tabular-nums">
                {GUTTER_PX} × {block.spacing}
              </span>
            </span>
          </span>

          {(
            [
              ["top", block.spacing, false],
              ["bottom", block.spacing, false],
              ["left", GUTTER_PX, true],
              ["right", GUTTER_PX, true],
            ] as const
          ).map(([edge, value, horizontal]) => (
            <span
              key={edge}
              aria-hidden
              className={cn(
                "pointer-events-none absolute z-20 flex items-center justify-center",
                horizontal ? "inset-y-0 flex-row" : "inset-x-0 flex-col",
              )}
              style={{ [edge]: 0, ...(horizontal ? { width: GUTTER } : { height: block.spacing }) }}
            >
              <span
                className={cn(
                  "flex-1 border-dashed border-primary/40",
                  horizontal ? "border-t" : "border-l",
                )}
              />
              <span
                className={cn(
                  "text-[8px] leading-none font-medium tabular-nums text-primary",
                  horizontal ? "px-px" : "py-px",
                )}
              >
                {value}
              </span>
              <span
                className={cn(
                  "flex-1 border-dashed border-primary/40",
                  horizontal ? "border-t" : "border-l",
                )}
              />
            </span>
          ))}
        </>
      )}
    </motion.div>
  )
}

function DemoBlockBody({ block }: { block: DemoBlock }) {
  const colour = block.accent ? "var(--primary)" : block.muted ? "#6b7280" : "#111827"
  const scale = 0.6

  switch (block.kind) {
    case "image":
      return (
        <div className="flex w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-neutral-300 bg-neutral-50 py-5 text-center text-neutral-400">
          <ImageOff className="size-3.5" />
          <span className="text-[9px]">Add an image URL in the panel</span>
        </div>
      )
    case "divider":
      return <div className="h-px w-full bg-neutral-200" />
    case "button":
      return (
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <span
            className="inline-block bg-primary text-center text-primary-foreground"
            style={{
              borderRadius: Math.round(6 * scale),
              padding: "7px 14px",
              fontSize: Math.round((block.size ?? 15) * scale),
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            {block.text}
          </span>
        </div>
      )
    case "list":
      return (
        <ul className="flex flex-col gap-1.5" style={{ color: colour }}>
          {(block.text ?? "").split("\n").filter(Boolean).map((item, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span aria-hidden className="mt-1.25 size-1 shrink-0 rounded-full bg-primary" />
              <span style={{ fontSize: Math.round((block.size ?? 15) * scale), lineHeight: 1.45 }}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      )
    default:
      return (
        <div
          style={{
            color: colour,
            fontSize: Math.round((block.size ?? 16) * scale),
            lineHeight: 1.3,
            fontWeight: block.weight ?? 400,
            textAlign: block.align ?? "left",
            letterSpacing: block.tracked ? "0.16em" : "-0.011em",
            fontVariantNumeric: block.tracked ? "tabular-nums" : undefined,
          }}
        >
          {block.text}
        </div>
      )
  }
}

const CONTENT_LABEL = (block: DemoBlock | null) =>
  block?.kind === "button" ? "Label" : block?.kind === "image" ? "Image URL" : "Content"

const PLACEHOLDER: Record<Kind, string> = {
  heading: "Your headline",
  text: "Write something…",
  list: "One item per line",
  image: "https://…",
  divider: "No content",
  button: "Get started",
}

function DemoInspector({ active }: { active: DemoBlock | null }) {
  const Icon = active ? META[active.kind].icon : null
  return (
    <div className="hidden flex-col overflow-hidden border-l border-border sm:flex">
      <div className="p-2">
        <div className="flex gap-0.5 rounded-full bg-muted p-0.5">
          <div className="flex h-5 flex-1 items-center justify-center rounded-full bg-background text-[9px] font-medium">
            Element
          </div>
          <div className="flex h-5 flex-1 items-center justify-center rounded-full text-[9px] font-medium text-muted-foreground">
            Body
          </div>
        </div>
      </div>

      <div className="flex h-8 items-center gap-1.5 border-b border-border px-3">
        <AnimatePresence mode="wait">
          {Icon && active ? (
            <motion.div
              key={active.kind}
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-1.5 text-[10px] font-semibold"
            >
              <Icon className="size-3 text-primary" />
              {META[active.kind].label}
            </motion.div>
          ) : (
            <motion.span
              key="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-1.5 w-12 rounded-full bg-muted"
            />
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-1.5 p-3">
        <span className="text-[9px] font-medium text-muted-foreground">{CONTENT_LABEL(active)}</span>
        <div className="min-h-7 rounded-md border border-border px-1.5 py-1 text-[9px] leading-relaxed">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={active?.id ?? "empty"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className={cn(
                "line-clamp-2 block",
                (!active || !active.text) && "text-muted-foreground",
              )}
            >
              {active ? (active.text?.split("\n")[0] ?? PLACEHOLDER[active.kind]) : "Select a block"}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <motion.div animate={{ opacity: active ? 1 : 0.45 }} transition={{ duration: 0.25 }}>
        {["Color", "Size", "Layout"].map((label) => (
          <div
            key={label}
            className="flex items-center justify-between border-b border-border px-3 py-2.5 text-[10px] font-semibold tracking-wide text-muted-foreground"
          >
            {label}
            <ChevronDown className="size-3 text-muted-foreground" />
          </div>
        ))}
      </motion.div>
    </div>
  )
}

function GhostBlock({ ghost }: { ghost: Ghost }) {
  const Icon = META[ghost.kind].icon
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 z-40"
      initial={{ x: ghost.sx, y: ghost.sy }}
      animate={{ x: ghost.ex, y: ghost.ey }}
      transition={FLIGHT}
    >
      <motion.div
        className="flex items-center gap-1.5 rounded-xl border border-primary bg-primary px-2 py-1.5 text-primary-foreground"
        style={{ x: "-50%", y: "-50%" }}
        initial={{ opacity: 0, scale: 0.9, width: 96 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1.04, 1.04, 1], width: [96, 96, ghost.w, ghost.w] }}
        transition={{
          width: { duration: 0.9, times: [0, 0.3, 0.6, 1], ease: "easeInOut" },
          opacity: { duration: 0.9, times: [0, 0.14, 0.78, 1] },
          scale: { duration: 0.9, times: [0, 0.14, 0.78, 1] },
        }}
      >
        <Icon className="size-3 shrink-0" />
        <span className="truncate text-[9px] font-semibold">{META[ghost.kind].label}</span>
      </motion.div>
    </motion.div>
  )
}
