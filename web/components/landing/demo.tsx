"use client"

import { useEffect, useRef, useState } from "react"
import {
  animate,
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
  type MotionValue,
} from "motion/react"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  ChevronLeft,
  Columns2,
  Copy,
  Download,
  Eye,
  FileCode2,
  Heading,
  Image as ImageIcon,
  List,
  Minus,
  Monitor,
  MousePointerClick,
  Plus,
  Quote,
  Redo2,
  Search,
  Share2,
  Smartphone,
  Table,
  Type,
  Undo2,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

// A looping recording of the editor, played by a cursor: it drags blocks from the
// palette onto the paper, restyles one in the inspector, and downloads the file —
// the three steps below, in that order. Each scene builds a different email. It
// only plays while it is on screen; reduced motion shows the first email finished.

const GUTTER = 13 // the paper's 24px side padding, at the demo's scale
const SCALE = 0.7 // email type sizes, drawn at the demo's scale
const PAPER = 420

type Kind = "heading" | "text" | "image" | "button" | "list" | "divider"
type Align = "left" | "center"
type Tone = "ink" | "muted" | "accent"

type DemoBlock = {
  id: string
  kind: Kind
  text?: string
  size?: number
  spacing: number
  weight?: number
  align?: Align
  tone?: Tone
  tracked?: boolean
}

type Edit =
  | { id: string; control: "size"; to: number }
  | { id: string; control: "align"; to: Align }
  | { id: string; control: "tone"; to: Tone }

type Scene = { file: string; weight: string; blocks: DemoBlock[]; edit: Edit }

const SCENES: Scene[] = [
  {
    file: "welcome.html",
    weight: "9 KB",
    blocks: [
      { id: "w-img", kind: "image", spacing: 14 },
      { id: "w-h", kind: "heading", text: "Welcome aboard", size: 20, weight: 700, spacing: 10 },
      {
        id: "w-t",
        kind: "text",
        text: "Everything you need to get started is in one place.",
        size: 15,
        spacing: 6,
        tone: "muted",
      },
      { id: "w-b", kind: "button", text: "Open the dashboard", size: 15, spacing: 14 },
    ],
    edit: { id: "w-h", control: "size", to: 30 },
  },
  {
    file: "verify.html",
    weight: "6 KB",
    blocks: [
      { id: "v-h", kind: "heading", text: "Confirm your email", size: 24, weight: 700, spacing: 12 },
      {
        id: "v-t",
        kind: "text",
        text: "Enter this code to finish signing in.",
        size: 15,
        spacing: 6,
        tone: "muted",
      },
      {
        id: "v-c",
        kind: "heading",
        text: "418 302",
        size: 34,
        weight: 700,
        spacing: 14,
        align: "center",
        tracked: true,
      },
      {
        id: "v-n",
        kind: "text",
        text: "It expires in 10 minutes.",
        size: 13,
        spacing: 8,
        align: "center",
        tone: "muted",
      },
    ],
    edit: { id: "v-c", control: "tone", to: "accent" },
  },
  {
    file: "digest.html",
    weight: "11 KB",
    blocks: [
      { id: "d-h", kind: "heading", text: "This week in design", size: 24, weight: 700, spacing: 12 },
      {
        id: "d-l",
        kind: "list",
        text: "Designing calmer interfaces\nThe case for boring technology\nType that scales with the reader",
        size: 15,
        spacing: 8,
        tone: "muted",
      },
      { id: "d-d", kind: "divider", spacing: 10 },
      { id: "d-b", kind: "button", text: "Read on the web", size: 15, spacing: 14 },
    ],
    edit: { id: "d-b", control: "align", to: "center" },
  },
]

function applyEdit(block: DemoBlock, edit: Edit): DemoBlock {
  if (block.id !== edit.id) return block
  if (edit.control === "size") return { ...block, size: edit.to }
  if (edit.control === "align") return { ...block, align: edit.to }
  return { ...block, tone: edit.to }
}

const finished = (scene: Scene) => scene.blocks.map((block) => applyEdit(block, scene.edit))

// The palette shows the editor's groups; only the first six kinds are ever dragged.
type TileKind = Kind | "quote" | "table" | "columns" | "social"

const META: Record<TileKind, { icon: LucideIcon; label: string }> = {
  heading: { icon: Heading, label: "Heading" },
  text: { icon: Type, label: "Text" },
  list: { icon: List, label: "List" },
  quote: { icon: Quote, label: "Quote" },
  image: { icon: ImageIcon, label: "Image" },
  table: { icon: Table, label: "Table" },
  columns: { icon: Columns2, label: "Columns" },
  divider: { icon: Minus, label: "Divider" },
  button: { icon: MousePointerClick, label: "Button" },
  social: { icon: Share2, label: "Social" },
}

const GROUPS: { label: string; kinds: TileKind[] }[] = [
  { label: "Text", kinds: ["heading", "text", "list", "quote"] },
  { label: "Media", kinds: ["image", "table"] },
  { label: "Layout", kinds: ["columns", "divider"] },
  { label: "Actions", kinds: ["button", "social"] },
]

const TONE: Record<Tone, string> = { ink: "#111827", muted: "#6b7280", accent: "var(--primary)" }
const toneOf = (block: DemoBlock): Tone => block.tone ?? (block.kind === "button" ? "accent" : "ink")

const SIZE_MIN = 12
const SIZE_MAX = 40
const sizeRatio = (size: number) => (size - SIZE_MIN) / (SIZE_MAX - SIZE_MIN)

// A pointer's glide: x and y on slightly different curves, so the path bows a
// little the way a hand moves rather than running along a ruler.
const EASE_X = [0.4, 0, 0.2, 1] as const
const EASE_Y = [0.3, 0, 0.15, 1] as const
const SETTLE = [0.22, 1, 0.36, 1] as const

type Drag = { kind: Kind; over: boolean; width: number }
type Live = { id: string; size: number }

export function BuilderDemo() {
  return (
    // A tinted block offset behind the window, so the demo sits on the page like
    // one block stacked on another. The offset is padding on this box, so window
    // and block together end exactly on the content edges.
    <div className="relative isolate pr-2.5 pb-2.5 sm:pr-4 sm:pb-4">
      <div
        aria-hidden
        className="absolute top-2.5 right-0 bottom-0 left-2.5 -z-10 rounded-[1.75rem] bg-tint sm:top-4 sm:left-4"
      />
      <BuilderWindow />
    </div>
  )
}

function BuilderWindow() {
  const reduce = useReducedMotion()
  const boxRef = useRef<HTMLDivElement>(null)
  const inView = useInView(boxRef, { amount: 0.35 })
  const sceneRef = useRef(0)
  const cx = useMotionValue(0)
  const cy = useMotionValue(0)

  const [scene, setScene] = useState(0)
  const [blocks, setBlocks] = useState<DemoBlock[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [pressing, setPressing] = useState<string | null>(null)
  const [lifted, setLifted] = useState<Kind | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [dropY, setDropY] = useState<number | null>(null)
  const [overEmpty, setOverEmpty] = useState(false)
  const [live, setLive] = useState<Live | null>(null)
  const [pointer, setPointer] = useState({ visible: false, pressed: false, clicks: 0 })
  const [toast, setToast] = useState(false)

  useEffect(() => {
    const box = boxRef.current
    if (reduce || !inView || !box) return
    let cancelled = false
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const running = new Set<AnimationPlaybackControls>()

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(() => {
          timers.delete(t)
          resolve()
        }, ms)
        timers.add(t)
      })
    const run = (controls: AnimationPlaybackControls) => {
      running.add(controls)
      return controls.finished.then(() => {
        running.delete(controls)
      })
    }

    // Where something sits in the window, from the window's own top-left corner.
    // Null when it is not drawn — the inspector is hidden on a phone.
    const rect = (selector: string) => {
      const el = box.querySelector<HTMLElement>(selector)
      if (!el) return null
      const b = box.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return null
      return { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height }
    }
    const centre = (selector: string) => {
      const r = rect(selector)
      return r && { x: r.x + r.w / 2, y: r.y + r.h / 2 }
    }
    const park = () => {
      const c = rect("[data-canvas]")
      return c ? { x: c.x + c.w * 0.7, y: c.y + c.h * 0.84 } : { x: 0, y: 0 }
    }

    const glide = (to: { x: number; y: number }, duration = 0.6) =>
      Promise.all([
        run(animate(cx, to.x, { duration, ease: EASE_X })),
        run(animate(cy, to.y, { duration: duration * 0.9, ease: EASE_Y })),
      ])
    const press = (on: boolean) => setPointer((p) => ({ ...p, pressed: on, clicks: on ? p.clicks + 1 : p.clicks }))
    const click = async (target: string) => {
      setPressing(target)
      press(true)
      await wait(150)
      press(false)
      setPressing(null)
    }

    const play = async () => {
      await wait(0)
      const start = park()
      cx.set(start.x)
      cy.set(start.y)
      setPointer((p) => ({ ...p, visible: true }))

      let i = sceneRef.current
      while (!cancelled) {
        sceneRef.current = i
        const { blocks: steps, edit } = SCENES[i]
        setScene(i)
        setBlocks([])
        setSelectedId(null)
        await wait(850) // the last email leaves, a blank paper arrives
        if (cancelled) return

        // Build: each block is carried from its tile to the end of the email.
        let list: DemoBlock[] = []
        for (const block of steps) {
          const tile = centre(`[data-tile="${block.kind}"]`)
          if (!tile) return
          await glide(tile, 0.55)
          if (cancelled) return
          setHover(`tile:${block.kind}`)
          await wait(120)
          setPressing(`tile:${block.kind}`)
          press(true)
          await wait(140)
          if (cancelled) return

          const paper = rect("[data-paper]")
          if (!paper) return
          const last = list.length ? rect(`[data-row-id="${list[list.length - 1].id}"]`) : null
          const slot = last ? last.y + last.h : paper.y + paper.h / 2
          setPressing(null)
          setHover(null)
          setLifted(block.kind)
          setDrag({ kind: block.kind, over: false, width: Math.max(100, paper.w - GUTTER * 2) })

          // Over the paper, the tile turns into the bar it will become, and the
          // slot it will fill lights up.
          let entered = false
          const stop = cx.on("change", (x) => {
            if (entered || x < paper.x + 6) return
            entered = true
            setDrag((d) => d && { ...d, over: true })
            if (last) setDropY(slot - paper.y)
            else setOverEmpty(true)
          })
          await glide({ x: paper.x + paper.w / 2, y: last ? slot + 2 : slot }, 0.75)
          stop()
          if (cancelled) return
          await wait(200)

          press(false)
          setDrag(null)
          setDropY(null)
          setOverEmpty(false)
          setLifted(null)
          list = [...list, block]
          setBlocks(list)
          setSelectedId(block.id)
          await wait(480)
          if (cancelled) return
        }

        // Style: select one block on the canvas, then change it in the inspector.
        const body = centre(`[data-row-id="${edit.id}"] [data-body]`)
        if (body) {
          await glide(body, 0.6)
          if (cancelled) return
          await click(`row:${edit.id}`)
          setSelectedId(edit.id)
          await wait(420)
          if (cancelled) return
        }
        if (edit.control === "size") {
          const from = list.find((b) => b.id === edit.id)?.size ?? edit.to
          const knob = centre("[data-knob]")
          const track = rect("[data-track]")
          if (knob && track) {
            await glide(knob, 0.6)
            if (cancelled) return
            setPressing("knob")
            press(true)
            await wait(140)
          }
          const sweep = { duration: 0.95, ease: [0.45, 0, 0.25, 1] as const }
          await Promise.all([
            knob && track ? run(animate(cx, track.x + track.w * sizeRatio(edit.to), sweep)) : null,
            run(animate(from, edit.to, { ...sweep, onUpdate: (size) => setLive({ id: edit.id, size }) })),
          ])
          if (cancelled) return
          press(false)
          setPressing(null)
        } else {
          const control = centre(`[data-control="${edit.control}-${edit.to}"]`)
          if (control) {
            await glide(control, 0.65)
            if (cancelled) return
            await click(`${edit.control}-${edit.to}`)
          }
        }
        list = list.map((b) => applyEdit(b, edit))
        setBlocks(list)
        setLive(null)
        await wait(900)
        if (cancelled) return

        // Export: download the file.
        const download = centre("[data-download]")
        if (download) {
          await glide(download, 0.75)
          if (cancelled) return
          setHover("download")
          await wait(100)
          await click("download")
          setToast(true)
          await wait(1700)
          if (cancelled) return
          setToast(false)
          setHover(null)
        }
        glide(park(), 0.9)
        i = (i + 1) % SCENES.length
      }
    }
    play()

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      running.forEach((controls) => controls.stop())
      // Off screen it stops cleanly: nothing left mid-drag for the next look.
      setDrag(null)
      setDropY(null)
      setOverEmpty(false)
      setLifted(null)
      setPressing(null)
      setHover(null)
      setLive(null)
      setToast(false)
      setPointer((p) => ({ ...p, visible: false, pressed: false }))
    }
  }, [reduce, inView, cx, cy])

  const shown = reduce ? finished(SCENES[0]) : blocks
  const selected = reduce ? SCENES[0].edit.id : selectedId
  const active = shown.find((b) => b.id === selected) ?? null

  return (
    <div
      ref={boxRef}
      className="relative w-full overflow-hidden rounded-[1.75rem] border border-border bg-card text-left shadow-[0_40px_80px_-40px_oklch(0_0_0/0.45)] select-none"
    >
      <DemoTopbar hover={hover} pressing={pressing} />

      <div className="grid h-110 grid-cols-[132px_1fr] sm:grid-cols-[176px_1fr_176px]">
        <DemoPalette hover={hover} pressing={pressing} lifted={lifted} />
        <DemoCanvas
          scene={reduce ? 0 : scene}
          blocks={shown}
          selectedId={selected}
          live={live}
          dropY={dropY}
          overEmpty={overEmpty}
          toast={toast}
          fresh={!reduce}
        />
        <DemoInspector block={active} pressing={pressing} live={live} />
      </div>

      {!reduce && <Pointer x={cx} y={cy} drag={drag} {...pointer} />}
    </div>
  )
}

function DemoTopbar({ hover, pressing }: { hover: string | null; pressing: string | null }) {
  const rule = <span className="mx-1 h-4 w-px shrink-0 self-center bg-border" />
  const icon = "flex size-6 items-center justify-center rounded-md text-muted-foreground"
  return (
    <div className="flex h-12 items-center gap-1 border-b border-border px-3">
      <span className="mr-1 hidden items-center gap-1.5 sm:flex" aria-hidden>
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
      </span>
      <span className={icon}>
        <ChevronLeft className="size-3.5" />
      </span>
      <span className="mr-auto truncate text-[11px] font-semibold">Email Editor</span>

      <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Monitor className="size-3.5" />
      </span>
      <span className={icon}>
        <Smartphone className="size-3.5" />
      </span>
      <span className={cn(icon, "hidden sm:flex")}>
        <Eye className="size-3.5" />
      </span>
      {rule}
      <span className={cn(icon, "text-muted-foreground/45")}>
        <Undo2 className="size-3.5" />
      </span>
      <span className={cn(icon, "hidden text-muted-foreground/45 sm:flex")}>
        <Redo2 className="size-3.5" />
      </span>
      {rule}
      <span className="hidden h-6 items-center gap-1 rounded-full px-2 text-[10px] font-semibold sm:flex">
        <Copy className="size-3" />
        Copy
      </span>
      <motion.span
        data-download
        animate={{ scale: pressing === "download" ? 0.93 : 1 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.25 }}
        className={cn(
          "flex h-6 items-center gap-1 rounded-full px-2 text-[10px] font-semibold text-primary-foreground transition-colors",
          hover === "download" ? "bg-primary/85" : "bg-primary",
        )}
      >
        <Download className="size-3" />
        Download
      </motion.span>
    </div>
  )
}

function DemoPalette({
  hover,
  pressing,
  lifted,
}: {
  hover: string | null
  pressing: string | null
  lifted: Kind | null
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5 overflow-hidden border-r border-border p-2">
      <div className="flex h-6 shrink-0 items-center gap-1.5 rounded-md border border-border px-1.5 text-[9px] text-muted-foreground">
        <Search className="size-3 shrink-0" />
        <span className="truncate">Search blocks</span>
      </div>
      {GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1.5">
          <span className="px-0.5 text-[8px] font-semibold tracking-wider text-muted-foreground uppercase">
            {group.label}
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {group.kinds.map((kind) => {
              const { icon: Icon, label } = META[kind]
              const out = lifted === kind
              const over = hover === `tile:${kind}`
              return (
                <motion.div
                  key={kind}
                  data-tile={kind}
                  animate={{ scale: pressing === `tile:${kind}` ? 0.94 : 1 }}
                  transition={{ type: "spring", bounce: 0.3, duration: 0.25 }}
                  className={cn(
                    "flex h-10 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border transition-colors duration-150",
                    out
                      ? "border-dashed border-foreground/25 bg-transparent text-muted-foreground"
                      : over
                        ? "border-transparent bg-muted text-foreground"
                        : "border-transparent bg-muted/60 text-foreground/75",
                  )}
                >
                  <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
                  <span
                    className={cn(
                      "w-full truncate px-0.5 text-center text-[8px] leading-3 font-medium",
                      over ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function DemoCanvas({
  scene,
  blocks,
  selectedId,
  live,
  dropY,
  overEmpty,
  toast,
  fresh,
}: {
  scene: number
  blocks: DemoBlock[]
  selectedId: string | null
  live: Live | null
  dropY: number | null
  overEmpty: boolean
  toast: boolean
  fresh: boolean
}) {
  return (
    <div
      data-canvas
      className="relative min-w-0 overflow-hidden bg-muted/60 bg-[radial-gradient(color-mix(in_oklab,var(--color-foreground)_13%,transparent)_1px,transparent_1px)] bg-size-[14px_14px]"
    >
      <div className="mx-auto h-full px-4 pt-4" style={{ maxWidth: PAPER + 32 }}>
        {/* One paper per email. Between scenes the finished one leaves and a blank
            one takes its place; `wait` keeps them from overlapping. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={scene}
            data-paper
            initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease: SETTLE }}
            className="relative w-full overflow-hidden rounded-[4px] bg-white py-2 shadow-[0_1px_2px_oklch(0_0_0/0.06),0_12px_28px_-14px_oklch(0_0_0/0.25)]"
          >
            <AnimatePresence initial={false}>
              {blocks.length === 0 && <EmptyPaper key="empty" over={overEmpty} />}
              {blocks.map((block) => (
                <DemoRow
                  key={block.id}
                  block={block}
                  size={live?.id === block.id ? live.size : undefined}
                  selected={block.id === selectedId}
                  fresh={fresh}
                />
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {dropY !== null && (
                <motion.div
                  key="drop"
                  aria-hidden
                  initial={{ opacity: 0, scaleX: 0.6 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ duration: 0.2, ease: SETTLE }}
                  className="pointer-events-none absolute z-20 h-0.5 rounded-full bg-primary"
                  style={{ top: dropY - 1, left: GUTTER, right: GUTTER }}
                >
                  <span className="absolute -top-0.75 -left-1 size-2 rounded-full border-2 border-primary bg-white" />
                  <span className="absolute -top-0.75 -right-1 size-2 rounded-full border-2 border-primary bg-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.18 } }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.45 }}
            className="absolute inset-x-0 bottom-3 z-30 mx-auto flex w-max max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-xl bg-foreground py-1.5 pr-3 pl-1.5 text-background shadow-lg shadow-black/20"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-background/15">
              <FileCode2 className="size-3.5" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[10px] leading-tight font-semibold">{SCENES[scene].file}</span>
              <span className="text-[8px] leading-tight opacity-65">Downloaded · {SCENES[scene].weight}</span>
            </span>
            <Check className="ml-0.5 size-3.5 shrink-0" strokeWidth={2.5} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function EmptyPaper({ over }: { over: boolean }) {
  return (
    <motion.div
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: SETTLE }}
      className="overflow-hidden"
    >
      <div className="px-2.5 py-1">
        <div
          className={cn(
            "flex flex-col items-center gap-1 rounded-md border border-dashed px-4 py-6 text-center transition-colors duration-200",
            over ? "border-primary bg-primary/5 text-primary" : "border-neutral-300 text-neutral-400",
          )}
        >
          <Plus className="size-4" />
          <span className="mt-0.5 text-[10px] font-semibold text-neutral-700">Drop a block here</span>
          <span className="text-[8px] text-neutral-500">Drag one in from the palette.</span>
        </div>
      </div>
    </motion.div>
  )
}

function DemoRow({
  block,
  size,
  selected,
  fresh,
}: {
  block: DemoBlock
  size?: number
  selected: boolean
  fresh: boolean
}) {
  return (
    // Arrives by growing in, so the paper lengthens under it rather than jumping.
    <motion.div
      data-row-id={block.id}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ height: { type: "spring", bounce: 0.12, duration: 0.45 }, opacity: { duration: 0.25 } }}
      className="relative"
    >
      <div style={{ padding: `${block.spacing}px ${GUTTER}px` }}>
        <div data-body>
          <DemoBlockBody block={block} size={size} />
        </div>
      </div>

      {fresh && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-primary/10"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.9, delay: 0.25 }}
        />
      )}

      <AnimatePresence>
        {selected && (
          <motion.span
            key="selection"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute z-10 rounded-[3px] border-[1.5px] border-primary"
            style={{ inset: `${Math.max(3, block.spacing - 4)}px ${GUTTER - 5}px` }}
          >
            <span className="absolute -top-[1.5px] -left-[1.5px] -translate-y-full rounded-t-[3px] bg-primary px-1 text-[8px] leading-3 font-medium text-primary-foreground">
              {META[block.kind].label}
            </span>
            {(["-top-[3.5px] -left-[3.5px]", "-top-[3.5px] -right-[3.5px]", "-bottom-[3.5px] -left-[3.5px]", "-bottom-[3.5px] -right-[3.5px]"] as const).map(
              (at) => (
                <span
                  key={at}
                  className={cn("absolute size-1.5 rounded-[1px] border border-primary bg-white", at)}
                />
              ),
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function DemoBlockBody({ block, size }: { block: DemoBlock; size?: number }) {
  const fontSize = (size ?? block.size ?? 15) * SCALE
  const tone = toneOf(block)

  switch (block.kind) {
    case "image":
      return (
        <div className="relative h-16 overflow-hidden rounded-md bg-primary/15 sm:h-24">
          <span className="absolute top-3 right-7 size-4 rounded-full bg-white/80" />
          <span className="absolute -bottom-7 -left-6 h-14 w-1/2 rounded-[50%] bg-primary/25" />
          <span className="absolute -right-8 -bottom-9 h-16 w-2/3 rounded-[50%] bg-primary/20" />
        </div>
      )
    case "divider":
      return <div className="h-px w-full bg-neutral-200" />
    case "button":
      return (
        <div className="flex" style={{ justifyContent: block.align === "center" ? "center" : "flex-start" }}>
          {/* Only a change of alignment animates it: the paper moving under it as
              other blocks change size is not this button's move to make. */}
          <motion.span
            layout="position"
            layoutDependency={block.align}
            transition={{ type: "spring", bounce: 0.2, duration: 0.55 }}
            className={cn(
              "inline-block rounded-[4px] px-3.5 py-[7px] leading-none font-semibold transition-colors duration-300",
              tone === "ink" ? "bg-neutral-900 text-white" : "bg-primary text-primary-foreground",
            )}
            style={{ fontSize }}
          >
            {block.text}
          </motion.span>
        </div>
      )
    case "list":
      return (
        <ul className="flex flex-col gap-1.5" style={{ color: TONE[tone] }}>
          {(block.text ?? "")
            .split("\n")
            .filter(Boolean)
            .map((item, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span aria-hidden className="mt-1.25 size-1 shrink-0 rounded-full bg-primary" />
                <span style={{ fontSize, lineHeight: 1.45 }}>{item}</span>
              </li>
            ))}
        </ul>
      )
    default:
      return (
        <div
          className="transition-colors duration-300"
          style={{
            color: TONE[tone],
            fontSize,
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

const CONTENT_PLACEHOLDER: Partial<Record<Kind, string>> = {
  image: "https://…",
  divider: "No content",
}

const ALIGNS: { value: Align | "right"; icon: LucideIcon }[] = [
  { value: "left", icon: AlignLeft },
  { value: "center", icon: AlignCenter },
  { value: "right", icon: AlignRight },
]

const SWATCHES: { tone: Tone; className: string }[] = [
  { tone: "ink", className: "bg-neutral-900" },
  { tone: "muted", className: "bg-neutral-500" },
  { tone: "accent", className: "bg-primary" },
]

function Field({ label, value, children }: { label: string; value?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-[8px] font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
        {value !== undefined && <span className="tracking-normal text-foreground tabular-nums">{value}</span>}
      </span>
      {children}
    </div>
  )
}

function DemoInspector({
  block,
  pressing,
  live,
}: {
  block: DemoBlock | null
  pressing: string | null
  live: Live | null
}) {
  const meta = block ? META[block.kind] : null
  const Icon = meta?.icon
  const styled = Boolean(block && block.kind !== "image" && block.kind !== "divider")
  const size = block && live?.id === block.id ? live.size : block?.size
  const ratio = size ? Math.min(1, Math.max(0, sizeRatio(size))) : 0.3
  const tone = block ? toneOf(block) : null
  const align = block?.align ?? "left"

  return (
    <div className="hidden min-w-0 flex-col overflow-hidden border-l border-border sm:flex">
      <div className="p-2">
        <div className="flex gap-0.5 rounded-full bg-muted p-0.5">
          <div className="flex h-5 flex-1 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
            Block
          </div>
          <div className="flex h-5 flex-1 items-center justify-center rounded-full text-[9px] font-medium text-muted-foreground">
            Email
          </div>
        </div>
      </div>

      <div className="flex h-10 items-center border-y border-border px-3">
        <AnimatePresence mode="wait" initial={false}>
          {meta && Icon ? (
            <motion.div
              key={block?.kind}
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 3 }}
              transition={{ duration: 0.16 }}
              className="flex items-center gap-2"
            >
              <span className="flex size-6 items-center justify-center rounded-md bg-muted text-foreground/80">
                <Icon className="size-3.5" strokeWidth={1.75} />
              </span>
              <span className="text-[10px] font-semibold">{meta.label}</span>
            </motion.div>
          ) : (
            <motion.span
              key="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[9px] text-muted-foreground"
            >
              Select a block
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-3.5 p-3">
        <Field label={CONTENT_LABEL(block)}>
          <div className="min-h-7 rounded-md border border-border px-1.5 py-1 text-[9px] leading-relaxed">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={block?.id ?? "empty"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
                className={cn("line-clamp-2 block", (!block || !block.text) && "text-muted-foreground")}
              >
                {block ? (block.text?.split("\n")[0] ?? CONTENT_PLACEHOLDER[block.kind]) : "Nothing selected"}
              </motion.span>
            </AnimatePresence>
          </div>
        </Field>

        <motion.div
          className="flex flex-col gap-3.5"
          animate={{ opacity: styled ? 1 : 0.4 }}
          transition={{ duration: 0.2 }}
        >
          <Field label="Align">
            <div className="grid grid-cols-3 gap-0.5 rounded-full bg-muted p-0.5">
              {ALIGNS.map(({ value, icon: AlignIcon }) => (
                <motion.span
                  key={value}
                  data-control={`align-${value}`}
                  animate={{ scale: pressing === `align-${value}` ? 0.9 : 1 }}
                  transition={{ type: "spring", bounce: 0.3, duration: 0.25 }}
                  className={cn(
                    "flex h-5 items-center justify-center rounded-full transition-colors duration-200",
                    styled && align === value ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  <AlignIcon className="size-3" />
                </motion.span>
              ))}
            </div>
          </Field>

          <Field label="Colour">
            <div className="flex items-center gap-2 px-0.5">
              {SWATCHES.map((swatch) => (
                <motion.span
                  key={swatch.tone}
                  data-control={`tone-${swatch.tone}`}
                  animate={{ scale: pressing === `tone-${swatch.tone}` ? 0.85 : 1 }}
                  transition={{ type: "spring", bounce: 0.3, duration: 0.25 }}
                  className={cn(
                    "size-4 rounded-full border border-foreground/15 ring-offset-2 ring-offset-card transition-shadow duration-200",
                    swatch.className,
                    styled && tone === swatch.tone && "ring-[1.5px] ring-foreground/70",
                  )}
                />
              ))}
            </div>
          </Field>

          <Field label="Size" value={styled && size ? Math.round(size) : "–"}>
            <div data-track className="relative mx-1.5 my-1 h-1 rounded-full bg-muted">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-primary"
                style={{ width: `${ratio * 100}%` }}
              />
              <motion.span
                data-knob
                animate={{ scale: pressing === "knob" ? 1.2 : 1 }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.25 }}
                className="absolute top-1/2 -mt-1.5 -ml-1.5 size-3 rounded-full border-2 border-card bg-primary shadow-sm"
                style={{ left: `${ratio * 100}%` }}
              />
            </div>
          </Field>
        </motion.div>
      </div>
    </div>
  )
}

// The demo's pointer, with whatever it is carrying. Its tip is the point (x, y).
function Pointer({
  x,
  y,
  drag,
  visible,
  pressed,
  clicks,
}: {
  x: MotionValue<number>
  y: MotionValue<number>
  drag: Drag | null
  visible: boolean
  pressed: boolean
  clicks: number
}) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 z-50"
      style={{ x, y }}
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence>{drag && <DragPreview key="drag" drag={drag} />}</AnimatePresence>

      {clicks > 0 && (
        <motion.span
          key={clicks}
          className="absolute -top-3.5 -left-3.5 size-7 rounded-full bg-primary/30"
          initial={{ scale: 0.3, opacity: 1 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      )}

      <motion.svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        className="relative drop-shadow-[0_2px_3px_oklch(0_0_0/0.3)]"
        style={{ marginLeft: -4, marginTop: -2.5, transformOrigin: "4px 2.5px" }}
        animate={{ scale: pressed ? 0.86 : 1 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.2 }}
      >
        <path
          d="M4 2.5v12.6c0 .45.54.67.86.36l2.9-2.83 1.95 4.53c.14.33.52.48.85.34l1.5-.64c.33-.14.48-.52.34-.85l-1.93-4.47h4.04c.45 0 .67-.54.35-.86L4.85 2.14C4.53 1.83 4 2.05 4 2.5Z"
          fill="#0a0a0a"
          stroke="#fff"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      </motion.svg>
    </motion.div>
  )
}

// What the editor shows while a block is dragged: a tile under the pointer that
// becomes a full-width bar over the paper — the shape it is about to take.
function DragPreview({ drag }: { drag: Drag }) {
  const { icon: Icon, label } = META[drag.kind]
  return (
    <motion.div
      className="absolute top-0 left-0"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.14 } }}
      transition={{ type: "spring", bounce: 0.25, duration: 0.3 }}
    >
      <motion.div
        className={cn(
          "flex -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden text-primary-foreground shadow-lg shadow-primary/25",
          drag.over ? "flex-row gap-1.5 bg-primary/75 backdrop-blur-sm" : "flex-col gap-1 bg-primary",
        )}
        initial={false}
        animate={
          drag.over
            ? { width: drag.width, height: 26, borderRadius: 8 }
            : { width: 50, height: 50, borderRadius: 12 }
        }
        transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
      >
        <Icon className="size-3.5 shrink-0" />
        <span className="text-[9px] font-medium whitespace-nowrap">{label}</span>
      </motion.div>
    </motion.div>
  )
}
