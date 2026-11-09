"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
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
import { CANDY, candyOf, type Candy } from "@/components/landing/candy"

// A looping recording of the editor: blocks fly from the palette onto the paper,
// one scene at a time. Palette cards wear their group's candy colour, the same
// mapping the rest of the page uses.

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

const META: Record<Kind, { icon: LucideIcon; label: string; candy: Candy }> = {
  heading: { icon: Heading, label: "Heading", candy: candyOf("heading") },
  text: { icon: Type, label: "Text", candy: candyOf("text") },
  list: { icon: List, label: "List", candy: candyOf("list") },
  image: { icon: ImageIcon, label: "Image", candy: candyOf("image") },
  divider: { icon: Minus, label: "Divider", candy: candyOf("divider") },
  button: { icon: MousePointerClick, label: "Button", candy: candyOf("button") },
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

export function BuilderDemo() {
  return (
    // A solid yellow block offset behind the window, so the demo sits on the page
    // like one block stacked on another. The offset is padding on this box, so
    // window and block together end exactly on the content edges.
    <div className="relative isolate pr-2.5 pb-2.5 sm:pr-4 sm:pb-4">
      <div
        aria-hidden
        className="absolute top-2.5 right-0 bottom-0 left-2.5 -z-10 rounded-[1.75rem] bg-candy-sun sm:top-4 sm:left-4"
      />
      <BuilderWindow />
    </div>
  )
}

function BuilderWindow() {
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

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-[1.75rem] border border-border bg-card text-left shadow-[0_40px_80px_-40px_oklch(0_0_0/0.45)]"
    >
      <DemoTopbar />

      <div className="grid h-110 grid-cols-[132px_1fr] sm:grid-cols-[176px_1fr_176px]">
        <DemoPalette pending={pending} />
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
    <div className="flex h-12 items-center gap-1 border-b border-border px-3">
      <span className="mr-1 hidden items-center gap-1.5 sm:flex" aria-hidden>
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
      </span>
      <span className="flex size-6 items-center justify-center rounded-md text-muted-foreground">
        <ChevronLeft className="size-3.5" />
      </span>
      <span className="mr-auto truncate text-[11px] font-semibold">Email Editor</span>

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
      <span className="hidden h-6 items-center gap-1 rounded-full px-2 text-[10px] font-semibold sm:flex">
        <Copy className="size-3" />
        Copy
      </span>
      <span className="flex h-6 items-center gap-1 rounded-full bg-primary px-2 text-[10px] font-semibold text-primary-foreground">
        <Download className="size-3" />
        Download
      </span>
    </div>
  )
}

function DemoPalette({ pending }: { pending: Kind | null }) {
  return (
    <div className="flex flex-col gap-1 overflow-hidden border-r border-border p-2">
      {GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1.5 pb-1">
          <span className="px-1 pt-1 text-[10px] font-semibold text-muted-foreground">
            {group.label}
          </span>
          {group.kinds.map((kind) => {
            const { icon: Icon, label, candy } = META[kind]
            const on = pending === kind
            return (
              <motion.div
                key={kind}
                data-card={kind}
                animate={{ scale: on ? 0.96 : 1 }}
                transition={MOVE}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-colors duration-200",
                  on ? cn("brick border-transparent text-ink", CANDY[candy].solid) : "border-border bg-card",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                    on ? "bg-white/45" : CANDY[candy].tint,
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <span className="flex-1 truncate text-[10px] font-semibold">{label}</span>
                <GripVertical
                  className={cn("size-3 shrink-0", on ? "text-ink/60" : "text-muted-foreground/50")}
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
    <div className="overflow-hidden bg-muted/60 bg-[radial-gradient(color-mix(in_oklab,var(--color-foreground)_13%,transparent)_1px,transparent_1px)] bg-size-[14px_14px]">
      <div className="mx-auto flex h-full flex-col p-4" style={{ maxWidth: PAPER + 36 }}>
        <div
          ref={paperRef}
          className={cn(
            "relative mx-auto w-full overflow-hidden",
            blocks.length === 0 ? "rounded-lg border border-dashed border-border bg-background" : "bg-white",
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
                <span className="brick flex size-9 items-center justify-center rounded-xl bg-candy-sun text-ink">
                  <Mail className="size-4.5" />
                </span>
                <span className="mt-1 text-[11px] font-semibold">Your email is empty</span>
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
  const kind = active ? META[active.kind] : null
  const Icon = kind?.icon
  return (
    <div className="hidden flex-col overflow-hidden border-l border-border sm:flex">
      <div className="p-2">
        <div className="flex gap-0.5 rounded-full bg-muted p-0.5">
          <div className="flex h-5 flex-1 items-center justify-center rounded-full bg-card text-[9px] font-semibold shadow-xs">
            Element
          </div>
          <div className="flex h-5 flex-1 items-center justify-center rounded-full text-[9px] font-medium text-muted-foreground">
            Body
          </div>
        </div>
      </div>

      <div className="flex h-9 items-center gap-1.5 border-b border-border px-3">
        <AnimatePresence mode="wait">
          {kind && Icon && active ? (
            <motion.div
              key={active.kind}
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-1.5 text-[10px] font-semibold"
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-md text-ink",
                  CANDY[kind.candy].solid,
                )}
              >
                <Icon className="size-3" />
              </span>
              {kind.label}
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
  const { icon: Icon, label, candy } = META[ghost.kind]
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 z-40"
      initial={{ x: ghost.sx, y: ghost.sy }}
      animate={{ x: ghost.ex, y: ghost.ey }}
      transition={FLIGHT}
    >
      <motion.div
        className={cn(
          "brick flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-ink",
          CANDY[candy].solid,
        )}
        style={{ x: "-50%", y: "-50%" }}
        initial={{ opacity: 0, scale: 0.9, width: 96 }}
        animate={{
          opacity: [0, 1, 1, 0],
          scale: [0.9, 1.04, 1.04, 1],
          width: [96, 96, ghost.w, ghost.w],
        }}
        transition={{
          width: { duration: 0.9, times: [0, 0.3, 0.6, 1], ease: "easeInOut" },
          opacity: { duration: 0.9, times: [0, 0.14, 0.78, 1] },
          scale: { duration: 0.9, times: [0, 0.14, 0.78, 1] },
        }}
      >
        <Icon className="size-3 shrink-0" />
        <span className="truncate text-[9px] font-semibold">{label}</span>
      </motion.div>
    </motion.div>
  )
}
