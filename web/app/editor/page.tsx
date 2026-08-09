"use client"

import { createContext, memo, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  AnimatePresence,
  Reorder,
  motion,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from "motion/react"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bookmark,
  Check,
  ChevronLeft,
  Copy as CopyIcon,
  Download,
  GripVertical,
  ImageOff,
  Mail,
  Maximize2,
  Minimize2,
  Monitor,
  Moon,
  Plus,
  Redo2,
  RotateCcw,
  Smartphone,
  Sun,
  Star,
  Trash2,
  Undo2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { formatBytes } from "@/lib/format"
import { rateExport, trackExport } from "@/core/client"
import { Logo } from "@/components/ui/logo"
import { alert } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { IndicatorFill, useIndicator } from "@/components/ui/indicator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  blockFont,
  blockSpacing,
  COLUMN_TYPES,
  columnContentWidth,
  EMAIL_WIDTH,
  FONT_KEYS,
  FONT_WEIGHTS,
  FONTS,
  makeColumnChild,
  META,
  PALETTE_GROUPS,
  parsePairs,
  PLACEHOLDERS,
  socialBadge,
  useBuilder,
  type Align,
  type Block,
  type BlockType,
  type Doc,
  type FontKey,
} from "@/components/builder/store"
import { renderEmailHtml } from "@/components/builder/export"
import { APP_NAME } from "@/core/meta"
import { HighlightedHtml } from "@/components/builder/highlight"
import { DROP_INSET, PaletteDndProvider, usePaletteDnd } from "@/components/builder/palette-dnd"
import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"

// Lazily, because tiptap/ProseMirror is a 466KB chunk — about a third of the editor's
// initial JavaScript — for a field that only exists when a Rich Text block is
// selected. Statically imported, every first-time visitor downloaded, parsed and
// evaluated all of it before they could drag a single block, and most sessions never
// insert one. `ssr: false` because the editor is a browser surface either way.
const RichTextField = dynamic(
  () => import("@/components/builder/rich-text").then((m) => m.RichTextField),
  { ssr: false, loading: () => <Skeleton className="h-28 w-full rounded-lg" /> },
)

const TOOLBAR_SPRING = { type: "spring", bounce: 0, duration: 0.35 } as const

const DRAG_SLIP = 8

export default function BuilderPage() {
  const select = useBuilder((s) => s.select)
  const undo = useBuilder((s) => s.undo)
  const redo = useBuilder((s) => s.redo)
  const duplicate = useBuilder((s) => s.duplicate)
  const remove = useBuilder((s) => s.remove)

  useEffect(() => {
    void useBuilder.persist.rehydrate()
  }, [])

  // The shortcuts an editor is expected to have — and, for ⌘D and ⌫, the ones the
  // block context menu was already advertising in its shortcut column while nothing
  // listened for them. A menu that names a key it does not implement is worse than a
  // menu with no hint at all: you learn it once, it fails, and you stop trusting the
  // other hints too.
  //
  // Every binding is inert while a field has focus. Undo inside a textarea must be the
  // TEXTAREA's undo, not the document's — stealing ⌘Z from a half-typed paragraph to
  // roll back a block is the kind of thing that loses work.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null
      const typing =
        !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
      if (typing) return

      const mod = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()

      if (event.key === "Escape") return select(null)

      if (mod && key === "z") {
        event.preventDefault()
        return event.shiftKey ? redo() : undo()
      }
      // Ctrl+Y is redo on Windows, where ⇧Ctrl+Z is not the convention everywhere.
      if (mod && key === "y") {
        event.preventDefault()
        return redo()
      }

      const selected = useBuilder.getState().selectedId
      if (!selected) return

      if (mod && key === "d") {
        // The browser would bookmark the page.
        event.preventDefault()
        return duplicate(selected)
      }
      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault()
        return remove(selected)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [select, undo, redo, duplicate, remove])

  return (
    <PreviewProvider>
      <PaletteDndProvider>
        <div className="flex min-h-0 flex-1 flex-col">
          <Topbar />
          <div className="grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-[20rem_minmax(0,1fr)_20rem]">
            <Palette />
            <Canvas />
            <Inspector />
          </div>
        </div>
      </PaletteDndProvider>
    </PreviewProvider>
  )
}

const RATING_LABELS = ["Bad", "Poor", "Fair", "Good", "Great"] as const

function Feedback({ rating, onRate }: { rating: number; onRate: (value: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {rating ? (
        <p className="text-sm text-muted-foreground">Thank you — noted.</p>
      ) : (
        <>
          <p className="text-sm font-medium">How was your experience?</p>
          <StarRating rating={rating} onRate={onRate} />
        </>
      )}
    </div>
  )
}

function StarRating({ rating, onRate }: { rating: number; onRate: (value: number) => void }) {
  const [hover, setHover] = useState(0)
  const active = hover || rating

  return (
    <div
      role="group"
      aria-label="Rate your experience"
      className="flex items-center gap-1.5"
      onPointerLeave={() => setHover(0)}
    >
      {RATING_LABELS.map((label, i) => {
        const value = i + 1
        const filled = value <= active
        return (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`${value} star${value > 1 ? "s" : ""} — ${label}`}
                onPointerEnter={() => setHover(value)}
                onFocus={() => setHover(value)}
                onBlur={() => setHover(0)}
                onClick={() => onRate(value)}
                className="rounded-full p-0.5 text-primary transition-transform duration-150 outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring active:scale-90"
              >
                <Star
                  className={cn(
                    "size-7 transition-colors duration-150",
                    filled ? "fill-current" : "fill-transparent text-muted-foreground/35",
                  )}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

function Topbar() {
  const router = useRouter()
  const reduce = useReducedMotion()
  const [preview, setPreview] = useState<string | null>(null)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const undo = useBuilder((s) => s.undo)
  const redo = useBuilder((s) => s.redo)
  const clear = useBuilder((s) => s.clear)
  const canUndo = useBuilder((s) => s.past.length > 0)
  const canRedo = useBuilder((s) => s.future.length > 0)
  const blocks = useBuilder((s) => s.blocks)
  const hasBlocks = blocks.length > 0
  const [rating, setRating] = useState(0)
  const blockTypes = blocks.flatMap((b) => [b.type, ...b.children.map((c) => c.type)])

  const build = () => {
    const { blocks, doc } = useBuilder.getState()
    return renderEmailHtml(blocks, doc)
  }

  const onDownload = () => {
    const blob = new Blob([build()], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "email.html"
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
    toast.success("email.html downloaded")
  }

  const onClear = async () => {
    if (await alert({ title: "Clear the email?", description: "Every block is removed. You can undo it.", action: "Clear", icon: Mail }))
      clear()
  }

  const onHome = async () => {
    if (
      hasBlocks &&
      !(await alert({
        title: "Leave the editor?",
        description: "You have unsaved changes. They won't be recovered if you leave. Leave anyway?",
        action: "Leave",
      }))
    )
      return
    router.push("/")
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b border-border px-3">
      <IconAction icon={<ChevronLeft />} label="Home" onClick={onHome} className="-ml-1" />
      <span className="mr-auto text-sm font-medium">Email Editor</span>

      <motion.div
        layout
        transition={TOOLBAR_SPRING}
        className="flex items-center gap-1 self-stretch"
      >
        <PreviewToggle />
        <ThemeToggle />
      </motion.div>

      <AnimatePresence mode="popLayout" initial={false}>
        {hasBlocks && (
          <motion.div
            key="history"
            className="flex items-center gap-1 self-stretch"
            initial={{ opacity: 0, x: reduce ? 0 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduce ? 0 : -10 }}
            transition={reduce ? { duration: 0.15 } : TOOLBAR_SPRING}
          >
            <div className="mx-1 h-5 w-px shrink-0 self-center bg-border" />
            <IconAction icon={<Undo2 />} label="Undo" disabled={!canUndo} onClick={undo} />
            <IconAction icon={<Redo2 />} label="Redo" disabled={!canRedo} onClick={redo} />
            <IconAction
              icon={<Trash2 />}
              label="Clear all"
              disabled={!hasBlocks}
              onClick={onClear}
              className="hover:text-destructive"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout" initial={false}>
        {hasBlocks && (
          <motion.div
            key="exports"
            className="flex items-center gap-1 self-stretch"
            variants={{
              show: { transition: { staggerChildren: reduce ? 0 : 0.06 } },
              exit: { transition: { staggerChildren: reduce ? 0 : 0.05, staggerDirection: -1 } },
            }}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {[
              <div key="sep" className="mx-1 h-5 w-px shrink-0 self-center bg-border" />,
              <Button key="copy" variant="ghost" size="sm" onClick={() => setPreview(build())}>
                <CopyIcon data-icon="inline-start" />
                Copy
              </Button>,
              <Button key="save" variant="secondary" size="sm" disabled>
                <Bookmark data-icon="inline-start" />
                Save
              </Button>,
              <Button key="dl" size="sm" onClick={() => setDownloadOpen(true)}>
                <Download data-icon="inline-start" />
                Download
              </Button>,
            ].map((child) => (
              <motion.div
                key={child.key}
                className="flex items-center self-stretch"
                variants={{
                  hidden: { opacity: 0, x: reduce ? 0 : 14 },
                  show: { opacity: 1, x: 0, transition: reduce ? { duration: 0.15 } : TOOLBAR_SPRING },
                  exit: { opacity: 0, x: reduce ? 0 : 14, transition: { duration: 0.15 } },
                }}
              >
                {child}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <CodeDialog html={preview} blockTypes={blockTypes} onClose={() => setPreview(null)} />

      <Dialog
        open={downloadOpen}
        onOpenChange={(open) => {
          setDownloadOpen(open)
          if (!open) setRating(0)
        }}
      >
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="overflow-hidden p-0 sm:max-w-3xl"
        >
          <div className="grid sm:min-h-90 sm:grid-cols-2">
            <div className="relative hidden overflow-hidden border-r border-border bg-muted/40 bg-[radial-gradient(color-mix(in_oklab,var(--color-foreground)_10%,transparent)_1px,transparent_1px)] bg-size-[16px_16px] sm:block">
              <div className="flex h-full items-center justify-center p-7">
                <Logo className="size-32 text-foreground" />
              </div>
              <span className="absolute bottom-7 left-7 text-base font-semibold tracking-tight">
                {APP_NAME}
              </span>
            </div>
            <div className="flex flex-col gap-6 p-7">
              <DialogHeader>
                <DialogTitle className="text-2xl tracking-tight">
                  Your email is ready
                </DialogTitle>
                <DialogDescription>
                  One self-contained .html file — table-based, inline-styled, and safe in
                  Outlook. Paste it into any platform and it lands the same everywhere.
                </DialogDescription>
              </DialogHeader>
              <Feedback rating={rating} onRate={setRating} />
              <div className="mt-auto grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setDownloadOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    onDownload()
                    void trackExport("download", build(), blockTypes, rating)
                    setDownloadOpen(false)
                  }}
                >
                  <Download data-icon="inline-start" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}

function IconAction({
  icon,
  label,
  disabled,
  onClick,
  className,
}: {
  icon: ReactNode
  label: string
  disabled?: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" disabled={disabled} onClick={onClick} className={className}>
          {icon}
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])
  const dark = resolvedTheme === "dark"

  return (
    <IconAction
      icon={mounted && dark ? <Sun /> : <Moon />}
      label={mounted && dark ? "Light" : "Dark"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    />
  )
}

function CodeDialog({
  html,
  blockTypes,
  onClose,
}: {
  html: string | null
  blockTypes: string[]
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [rating, setRating] = useState(0)
  const exportId = useRef<string | null>(null)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = () => {
    if (!html) return
    navigator.clipboard.writeText(html).then(() => setCopied(true)).catch(() => {})
    if (exportId.current === null)
      void trackExport("copy", html, blockTypes, rating).then((id) => {
        exportId.current = id
      })
  }

  const rate = (value: number) => {
    setRating(value)
    if (exportId.current) rateExport(exportId.current, value)
  }

  const title = "Email HTML"
  const description = "Table-based and inline-styled — paste it into any email platform."

  const lines = (html ?? "").split("\n")
  const bytes = html ? new TextEncoder().encode(html).length : 0

  return (
    <Dialog
      open={html !== null}
      onOpenChange={(open) => {
        if (!open) {
          setCopied(false)
          setExpanded(false)
          setRating(0)
          exportId.current = null
          onClose()
        }
      }}
    >
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        showCloseButton={!expanded}
        className={cn(
          "overflow-hidden p-0 transition-[max-width,height] duration-300 ease-out motion-reduce:transition-none",
          expanded
            ? "h-[calc(100svh-2rem)] sm:max-w-[calc(100vw-2rem)]"
            : "h-auto sm:max-w-3xl",
        )}
      >
        {expanded && (
          <DialogHeader className="sr-only">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        )}

        <div className={cn("grid min-h-0", expanded ? "h-full" : "sm:h-90 sm:grid-cols-2")}>
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-col bg-muted/40",
              !expanded && "border-b border-border sm:border-r sm:border-b-0",
            )}
          >
            <div
              className={cn(
                "flex shrink-0 items-center gap-1 border-b border-border py-1.5 pl-3",
                expanded ? "pr-1.5" : "pr-10 sm:pr-1.5",
              )}
            >
              <span className="truncate font-mono text-[11px] text-muted-foreground tabular-nums">
                {lines.length} lines · {formatBytes(bytes)}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={copy}
                aria-label={copied ? "Copied" : "Copy HTML"}
                className="ml-auto"
              >
                {copied ? <Check /> : <CopyIcon />}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setExpanded((value) => !value)}
                aria-label={expanded ? "Exit full screen" : "View full screen"}
                aria-pressed={expanded}
              >
                {expanded ? <Minimize2 /> : <Maximize2 />}
              </Button>
            </div>

            <div
              className={cn(
                "min-h-0 flex-1 overflow-auto",
                !expanded && "max-h-[40svh] sm:max-h-none",
              )}
            >
              <pre className="flex w-max min-w-full gap-3 p-3 font-mono text-xs leading-relaxed">
                <span
                  aria-hidden
                  className="shrink-0 text-right tabular-nums text-muted-foreground/45 select-none"
                >
                  {lines.map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </span>
                <code className="min-w-0">{html && <HighlightedHtml html={html} />}</code>
              </pre>
            </div>
          </div>

          {!expanded && (
            <div className="flex min-h-0 flex-col gap-6 p-7">
              <DialogHeader>
                <DialogTitle className="text-2xl tracking-tight">{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
              </DialogHeader>
              <Feedback rating={rating} onRate={rate} />
              <div className="mt-auto grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={copy}>
                  {copied ? (
                    <Check data-icon="inline-start" />
                  ) : (
                    <CopyIcon data-icon="inline-start" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Palette() {
  const add = useBuilder((state) => state.add)
  const { start, active } = usePaletteDnd()
  const dragging = useRef(false)

  return (
    <aside className="hidden overflow-y-auto border-r border-border bg-background sm:block">
      <div className="flex flex-col">
        {PALETTE_GROUPS.map((group) => (
          <div
            key={group.label}
            className="flex w-full min-w-0 flex-col gap-2 px-4 py-4 not-first:border-t not-first:border-border"
          >
            <h3 className="shrink-0 text-xs font-semibold tracking-wide text-muted-foreground capitalize select-none">
              {group.label}
            </h3>
            {group.types.map((type) => {
              const { label, icon: Icon } = META[type]
              const dragActive = active === type
              return (
                <button
                  key={type}
                  type="button"
                  title={label}
                  onPointerDown={(event) => {
                    dragging.current = false
                    const startX = event.clientX
                    const startY = event.clientY
                    const { pointerId } = event
                    const controller = new AbortController()
                    // window, not the button. A mouse pointer gets no implicit
                    // capture (the spec grants that to touch and pen only), so
                    // pointermove goes to whatever is under the cursor — and one
                    // 60Hz frame of a normal flick covers more than this 34px row.
                    // Bound to the button, a quick drag delivered neither move nor
                    // up: the gesture died silently AND the listener outlived it,
                    // so later merely HOVERING the row measured against a stale
                    // start point, cleared 6px, and began a real drag with no
                    // button held.
                    const done = () => controller.abort()
                    window.addEventListener(
                      "pointermove",
                      (ev: PointerEvent) => {
                        if (ev.pointerId !== pointerId) return
                        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 6) return
                        dragging.current = true
                        controller.abort()
                        start(type, ev.clientX, ev.clientY)
                      },
                      { signal: controller.signal },
                    )
                    window.addEventListener("pointerup", done, { signal: controller.signal })
                    window.addEventListener("pointercancel", done, { signal: controller.signal })
                  }}
                  onClick={() => {
                    if (!dragging.current) add(type)
                  }}
                  className={cn(
                    "group flex w-full touch-none items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-all duration-200 ease-out select-none",
                    dragActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted/40 text-sidebar-foreground hover:border-primary/40",
                    "active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ease-out [&_svg]:size-4",
                      dragActive
                        ? "bg-white/20 text-primary-foreground"
                        : "bg-transparent text-primary group-hover:bg-primary/10",
                    )}
                  >
                    <Icon />
                  </span>
                  <span className="flex-1 truncate text-xs font-semibold">{label}</span>
                  <GripVertical
                    className={cn(
                      "size-3.5 shrink-0 transition-all duration-200 ease-out",
                      dragActive
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground/50 group-hover:text-primary",
                    )}
                  />
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </aside>
  )
}

function DropLineBody() {
  return (
    <>
      <span className="size-2 shrink-0 rounded-full bg-primary" />
      <span className="h-0.5 flex-1 rounded-full bg-primary" />
    </>
  )
}

function SpacingBadge({
  edge,
  value,
  selected,
  hidden,
}: {
  edge: "top" | "bottom" | "left" | "right" | "full"
  value: number
  selected: boolean
  hidden: boolean
}) {
  const horizontal = edge === "left" || edge === "right"
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute z-30 flex items-center justify-center transition-opacity duration-150",
        horizontal ? "inset-y-0 flex-row" : "inset-x-0 flex-col",
        edge === "top"
          ? "top-0"
          : edge === "bottom"
            ? "bottom-0"
            : edge === "left"
              ? "left-0"
              : edge === "right"
                ? "right-0"
                : "inset-y-0",
        hidden ? "opacity-0" : selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
      )}
      style={edge === "full" ? undefined : horizontal ? { width: value } : { height: value }}
    >
      <span
        className={cn(
          "flex-1",
          horizontal ? "border-t border-dashed border-primary/40" : "border-l border-dashed border-primary/40",
        )}
      />
      <span
        className={cn(
          "text-[10px] font-medium leading-none text-primary tabular-nums",
          horizontal ? "px-0.5" : "py-0.5",
        )}
      >
        {value}
      </span>
      <span
        className={cn(
          "flex-1",
          horizontal ? "border-t border-dashed border-primary/40" : "border-l border-dashed border-primary/40",
        )}
      />
    </span>
  )
}

function useSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      setSize({ w: Math.round(rect.width), h: Math.round(rect.height) })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return size
}

const HANDLES = [
  "-top-[3px] -left-[3px]",
  "-top-[3px] -right-[3px]",
  "-bottom-[3px] -left-[3px]",
  "-bottom-[3px] -right-[3px]",
]

function measures(block: Block, size: { w: number; h: number } | null, doc: Doc) {
  const rows: { label: string; value: string }[] = []
  if (size) {
    rows.push({ label: "W", value: `${size.w}` })
    rows.push({ label: "H", value: `${size.h}` })
  }
  switch (block.type) {
    case "heading":
    case "text":
    case "richtext":
    case "list":
    case "quote":
    case "callout":
    case "button":
    case "menu":
    case "table":
      rows.push({ label: "Size", value: `${block.fontSize}` })
      break
    case "image":
      rows.push({ label: "Img", value: `${block.width}` })
      break
    case "divider":
      rows.push({ label: "Line", value: `${block.thickness}` })
      break
  }
  if (block.type !== "spacer") {
    const { x, y } = blockSpacing(block, doc)
    rows.push({ label: "Spacing", value: `${x} × ${y}` })
  }
  return rows
}

function SelectionFrame({
  block,
  label,
  hidden,
}: {
  block: Block
  label: string
  hidden: boolean
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const size = useSize(ref)
  const doc = useBuilder((state) => state.doc)
  const rows = measures(block, size, doc)

  return (
    <span
      ref={ref}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-30 transition-opacity duration-150",
        hidden && "opacity-0",
      )}
    >
      <span className="absolute inset-0 border border-dashed border-primary" />
      {HANDLES.map((corner) => (
        <span
          key={corner}
          className={cn("absolute size-1.5 rounded-[1px] border border-primary bg-background", corner)}
        />
      ))}
      <span className="absolute -top-5 left-0 rounded-sm bg-primary px-1.5 text-[10px] leading-4 font-medium text-primary-foreground">
        {label}
      </span>
      <span className="absolute -top-5 right-0 flex items-stretch overflow-hidden rounded-sm bg-primary text-[10px] leading-4 font-medium text-primary-foreground">
        {rows.map((row, i) => (
          <span
            key={row.label}
            className={cn(
              "flex items-center gap-1 px-1.5",
              i > 0 && "border-l border-primary-foreground/25",
            )}
          >
            <span className="opacity-60">{row.label}</span>
            <span className="tabular-nums">{row.value}</span>
          </span>
        ))}
      </span>
    </span>
  )
}

type Preview = "desktop" | "mobile"
const PREVIEW_WIDTH: Record<Preview, number> = { desktop: EMAIL_WIDTH, mobile: 390 }

const PreviewContext = createContext<{ preview: Preview; setPreview: (value: Preview) => void }>({
  preview: "desktop",
  setPreview: () => {},
})

function PreviewProvider({ children }: { children: ReactNode }) {
  const [preview, setPreview] = useState<Preview>("desktop")
  return <PreviewContext value={{ preview, setPreview }}>{children}</PreviewContext>
}

function PreviewToggle() {
  const { preview, setPreview } = useContext(PreviewContext)
  const options: { value: Preview; icon: ReactNode; label: string }[] = [
    { value: "desktop", icon: <Monitor />, label: "Desktop" },
    { value: "mobile", icon: <Smartphone />, label: "Mobile" },
  ]
  return (
    <div role="radiogroup" aria-label="Preview width" className="flex items-center gap-1">
      {options.map((option) => {
        const active = preview === option.value
        return (
          <Tooltip key={option.value}>
            <TooltipTrigger asChild>
              <Button
                role="radio"
                aria-checked={active}
                variant="ghost"
                size="icon-sm"
                onClick={() => setPreview(option.value)}
                className="aria-checked:bg-primary aria-checked:text-primary-foreground aria-checked:hover:bg-primary! aria-checked:hover:text-primary-foreground!"
              >
                {option.icon}
                <span className="sr-only">{option.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{option.label}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

function dotColor(background: string): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(background.trim())
  if (!hex) return "rgba(0,0,0,0.14)"
  const n = parseInt(hex[1], 16)
  const luminance =
    (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255
  return luminance > 0.5 ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.16)"
}

function Canvas() {
  const blocks = useBuilder((state) => state.blocks)
  const reorder = useBuilder((state) => state.reorder)
  const select = useBuilder((state) => state.select)
  const doc = useBuilder((state) => state.doc)

  const order = blocks.map((block) => block.id)

  const { contentRef, active: draggingType, dropY } = usePaletteDnd()
  const { preview } = useContext(PreviewContext)

  const reorderY = useMotionValue(0)
  const reorderOn = useMotionValue(0)

  return (
    <motion.div
      layoutScroll
      className="min-w-0 overflow-y-auto bg-size-[16px_16px]"
      style={{
        backgroundColor: doc.background,
        backgroundImage: `radial-gradient(${dotColor(doc.background)} 1px, transparent 1px)`,
      }}
      onClick={() => select(null)}
    >
      <div
        className="mx-auto flex min-h-full w-full flex-col p-[30px] transition-[max-width] duration-300 ease-out motion-reduce:transition-none"
        style={{ maxWidth: PREVIEW_WIDTH[preview] + 60 }}
      >
        {blocks.length === 0 ? (
          <Empty
            ref={contentRef}
            className={cn(
              "mx-auto border border-dashed transition-[max-width,border-color] duration-300 ease-out motion-reduce:transition-none",
              draggingType !== null ? "border-primary" : "border-neutral-300",
            )}
            // The empty state IS the paper, so it wears the document's own colour and
            // does not follow the app theme. An email is the colour it is in an inbox;
            // a placeholder that turns dark with the editor is showing you the app,
            // not the thing you are making — and it made the blank page and the first
            // block look like two different surfaces.
            style={{ maxWidth: PREVIEW_WIDTH[preview], backgroundColor: doc.contentBackground }}
          >
            <EmptyHeader
              className={cn(
                "transition-opacity duration-200 ease-out",
                draggingType !== null && "opacity-25",
              )}
            >
              {/* Fixed ink, for the same reason as the surface: these sit ON the
                  paper, so they take the paper's contrast, not the theme's. */}
              <EmptyMedia className="-rotate-6 text-primary">
                <Mail className="size-12" />
              </EmptyMedia>
              <EmptyTitle className="text-base text-neutral-900">Your email is empty</EmptyTitle>
              <EmptyDescription className="max-w-56 text-neutral-500">
                Add a block from the palette on the left to start designing.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div
            ref={contentRef}
            className="relative mx-auto w-full transition-[max-width] duration-300 ease-out motion-reduce:transition-none"
            style={{ maxWidth: PREVIEW_WIDTH[preview], backgroundColor: doc.contentBackground }}
            onClick={(event) => event.stopPropagation()}
          >
            <Reorder.Group as="div" axis="y" values={order} onReorder={reorder}>
              {blocks.map((block, index) => (
                <BlockRow
                  key={block.id}
                  block={block}
                  index={index}
                  isLast={index === blocks.length - 1}
                  doc={doc}
                  contentBackground={doc.contentBackground}
                  contentRef={contentRef}
                  reorderY={reorderY}
                  reorderOn={reorderOn}
                  paletteActive={draggingType !== null}
                />
              ))}
            </Reorder.Group>

            {draggingType !== null && dropY !== null && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 z-40 flex -translate-y-1/2 items-center gap-1.5"
                style={{ top: dropY }}
              >
                <DropLineBody />
              </div>
            )}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 z-40 flex -translate-y-1/2 items-center gap-1.5"
              style={{ top: reorderY, opacity: reorderOn }}
            >
              <DropLineBody />
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function BlockRow({
  block,
  index,
  isLast,
  doc,
  contentBackground,
  contentRef,
  reorderY,
  reorderOn,
  paletteActive,
}: {
  block: Block
  index: number
  isLast: boolean
  doc: Doc
  contentBackground: string
  contentRef: RefObject<HTMLDivElement | null>
  reorderY: MotionValue<number>
  reorderOn: MotionValue<number>
  paletteActive: boolean
}) {
  const selectedId = useBuilder((state) => state.selectedId)
  const select = useBuilder((state) => state.select)
  const remove = useBuilder((state) => state.remove)
  const duplicate = useBuilder((state) => state.duplicate)
  const move = useBuilder((state) => state.move)
  const reduce = useReducedMotion()
  const pad = blockSpacing(block, doc)
  const selected = selectedId === block.id
  const didDrag = useRef(false)

  const y = useMotionValue(0)
  const itemRef = useRef<HTMLDivElement | null>(null)
  const clampToContent = () => {
    const el = itemRef.current
    const content = contentRef.current
    if (!el || !content) return
    const item = el.getBoundingClientRect()
    const frame = content.getBoundingClientRect()
    const top = frame.top - DRAG_SLIP
    const bottom = frame.bottom + DRAG_SLIP
    const correction = item.top < top ? top - item.top : item.bottom > bottom ? bottom - item.bottom : 0
    if (correction !== 0) y.set(y.get() + correction)
  }

  const handleDrag = () => {
    clampToContent()
    const content = contentRef.current
    if (!content) return
    const rows = content.querySelectorAll<HTMLElement>("[data-block-row]")
    if (rows.length < 2) return
    const cr = content.getBoundingClientRect()
    const boundary = index <= 0 ? cr.top : rows[index - 1].getBoundingClientRect().bottom
    reorderY.set(boundary - cr.top + DROP_INSET)
    reorderOn.set(1)
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Reorder.Item
          ref={itemRef}
          as="div"
          value={block.id}
          data-block-row
          layout="position"
          layoutDependency={index}
          transition={reduce ? { duration: 0.12 } : { type: "spring", bounce: 0, duration: 0.3 }}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          whileDrag={{ zIndex: 50 }}
          onDrag={handleDrag}
          onDragEnd={() => reorderOn.set(0)}
          onPointerDownCapture={() => {
            didDrag.current = false
          }}
          onDragStart={() => {
            didDrag.current = true
          }}
          onClick={() => {
            if (!didDrag.current) select(block.id)
          }}
          style={{ y, backgroundColor: contentBackground }}
          className={cn("group relative cursor-default touch-none outline-none select-none active:cursor-grabbing", selected && "z-10")}
        >
          <span
            aria-hidden
            className="absolute top-1/2 -left-7 flex size-6 -translate-y-1/2 items-center justify-center text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-primary"
          >
            <GripVertical className="size-4" />
          </span>

          <button
            type="button"
            aria-label="Delete block"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              remove(block.id)
            }}
            className="absolute top-1/2 -right-7 z-30 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground/50 opacity-0 transition group-hover:opacity-100 hover:text-destructive"
          >
            <X className="size-3.5" />
          </button>

          <BlockPreview block={block} doc={doc} />

          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 z-20 ring-inset transition-shadow",
              selected ? "ring-0" : "ring-1 ring-transparent group-hover:ring-primary/40",
            )}
          />
          {selected && (
            <SelectionFrame block={block} label={META[block.type].label} hidden={paletteActive} />
          )}

          {block.type === "spacer" ? (
            <SpacingBadge edge="full" value={block.height} selected={selected} hidden={paletteActive} />
          ) : pad.y > 0 || pad.x > 0 ? (
            <>
              {pad.y > 0 && (
                <>
                  <SpacingBadge edge="top" value={pad.y} selected={selected} hidden={paletteActive} />
                  <SpacingBadge edge="bottom" value={pad.y} selected={selected} hidden={paletteActive} />
                </>
              )}
              {pad.x > 0 && (
                <>
                  <SpacingBadge edge="left" value={pad.x} selected={selected} hidden={paletteActive} />
                  <SpacingBadge edge="right" value={pad.x} selected={selected} hidden={paletteActive} />
                </>
              )}
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute z-20 rounded-sm border border-dashed border-primary/45 transition-opacity duration-150",
                  paletteActive
                    ? "opacity-0"
                    : selected
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100",
                )}
                style={{ top: pad.y, bottom: pad.y, left: pad.x, right: pad.x }}
              />
            </>
          ) : null}
        </Reorder.Item>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <ContextMenuItem onSelect={() => duplicate(block.id)}>
          <CopyIcon />
          Duplicate
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled={index === 0} onSelect={() => move(block.id, -1)}>
          <ArrowUp />
          Move up
        </ContextMenuItem>
        <ContextMenuItem disabled={isLast} onSelect={() => move(block.id, 1)}>
          <ArrowDown />
          Move down
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onSelect={() => remove(block.id)}>
          <Trash2 />
          Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

const BlockPreview = memo(function BlockPreviewImpl({ block, doc }: { block: Block; doc: Doc }) {
  const { x, y } = blockSpacing(block, doc)
  const padding = `${y}px ${x}px`
  const fontFamily = blockFont(block, doc)
  const band = block.background && block.background !== "transparent" ? block.background : undefined
  const justify =
    block.align === "center" ? "center" : block.align === "right" ? "flex-end" : "flex-start"

  switch (block.type) {
    case "heading":
      return (
        <div
          style={{
            padding,
            fontFamily,
            backgroundColor: band,
            color: block.color,
            fontSize: block.fontSize,
            lineHeight: 1.3,
            fontWeight: block.fontWeight,
            textAlign: block.align,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {block.text || PLACEHOLDERS.heading}
        </div>
      )

    case "text":
      return (
        <div
          style={{
            padding,
            fontFamily,
            backgroundColor: band,
            color: block.color,
            fontSize: block.fontSize,
            lineHeight: block.lineHeight,
            fontWeight: block.fontWeight,
            textAlign: block.align,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {block.text || PLACEHOLDERS.text}
        </div>
      )

    case "richtext": {
      const emptyRich = !block.html || block.html === "<p></p>"
      const richStyle = {
        padding,
        fontFamily,
        backgroundColor: band,
        color: block.color,
        fontSize: block.fontSize,
        lineHeight: block.lineHeight,
        textAlign: block.align,
        wordBreak: "break-word" as const,
      }
      return emptyRich ? (
        <div style={richStyle}>{PLACEHOLDERS.richtext}</div>
      ) : (
        <div
          className="[&_a]:text-[#2563eb] [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:m-0 [&_p:not(:last-child)]:mb-4 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-6"
          style={richStyle}
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      )
    }

    case "button": {
      const full = block.fullWidth
      return (
        <div style={{ padding, fontFamily, ...(full ? {} : { display: "flex", justifyContent: justify }) }}>
          <span
            style={{
              display: full ? "block" : "inline-block",
              width: full ? "100%" : undefined,
              boxSizing: "border-box",
              textAlign: "center",
              padding: "12px 24px",
              backgroundColor: block.background,
              color: block.color,
              fontSize: block.fontSize,
              fontWeight: block.fontWeight,
              lineHeight: 1,
              borderRadius: block.radius,
            }}
          >
            {block.text || PLACEHOLDERS.button}
          </span>
        </div>
      )
    }

    case "divider":
      return (
        <div style={{ padding, fontFamily }}>
          <div style={{ borderTop: `${block.thickness}px solid ${block.color}` }} />
        </div>
      )

    case "spacer":
      return <div style={{ height: block.height }} />

    case "list": {
      const lines = block.text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
      const empty = lines.length === 0
      const items = empty ? PLACEHOLDERS.list.split("\n") : lines
      const ListTag = block.listStyle === "numbered" ? "ol" : "ul"
      return (
        <div style={{ padding, fontFamily, backgroundColor: band }}>
          <ListTag
            style={{
              margin: 0,
              paddingLeft: block.listStyle === "none" ? 0 : 24,
              listStyleType:
                block.listStyle === "numbered" ? "decimal" : block.listStyle === "none" ? "none" : "disc",
              color: empty ? "#9ca3af" : block.color,
              fontSize: block.fontSize,
              lineHeight: block.lineHeight,
              textAlign: block.align,
              wordBreak: "break-word",
            }}
          >
            {items.map((item, index) => (
              <li key={index} style={{ marginBottom: index === items.length - 1 ? 0 : 8 }}>
                {item}
              </li>
            ))}
          </ListTag>
        </div>
      )
    }

    case "table": {
      const rows = block.text.trim()
        ? block.text.split(/\r?\n/).map((row) => row.split(" | "))
        : null
      const cellBorder = block.borders ? "1px solid #e5e7eb" : undefined
      return (
        <div style={{ padding, fontFamily, backgroundColor: band }}>
          {rows ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {rows.map((cells, rowIndex) => {
                  const header = block.headerRow && rowIndex === 0
                  return (
                    <tr key={rowIndex}>
                      {cells.map((cellText, colIndex) => (
                        <td
                          key={colIndex}
                          style={{
                            border: cellBorder,
                            backgroundColor: header ? "#f9fafb" : undefined,
                            padding: "8px 12px",
                            color: block.color,
                            fontSize: block.fontSize,
                            lineHeight: 1.4,
                            fontWeight: header ? 700 : block.fontWeight,
                            textAlign: block.align,
                            wordBreak: "break-word",
                          }}
                        >
                          {cellText}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div
              style={{
                color: "#9ca3af",
                fontSize: block.fontSize,
                lineHeight: 1.4,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {PLACEHOLDERS.table}
            </div>
          )}
        </div>
      )
    }

    case "quote":
      return (
        <div style={{ padding, fontFamily }}>
          <div style={{ borderLeft: `4px solid ${block.background}`, paddingLeft: 16 }}>
            <div
              style={{
                color: block.color,
                fontSize: block.fontSize,
                lineHeight: block.lineHeight,
                fontStyle: "italic",
                textAlign: block.align,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {block.text || PLACEHOLDERS.quote}
            </div>
            {block.author.trim() && (
              <div
                style={{
                  marginTop: 8,
                  color: block.authorColor,
                  fontSize: Math.max(12, Math.round(block.fontSize * 0.75)),
                  lineHeight: 1.4,
                  textAlign: block.align,
                  wordBreak: "break-word",
                }}
              >
                {`— ${block.author}`}
              </div>
            )}
          </div>
        </div>
      )

    case "callout":
      return (
        <div style={{ padding, fontFamily }}>
          <div
            style={{
              backgroundColor: block.background,
              color: block.color,
              borderRadius: block.radius,
              padding: "16px 20px",
              fontSize: block.fontSize,
              lineHeight: block.lineHeight,
              textAlign: block.align,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {block.text || PLACEHOLDERS.callout}
          </div>
        </div>
      )

    case "menu": {
      const parsed = parsePairs(block.text)
      const empty = parsed.length === 0
      const items = empty ? parsePairs(PLACEHOLDERS.menu) : parsed
      return (
        <div style={{ padding, fontFamily }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: justify,
              fontSize: block.fontSize,
              fontWeight: block.fontWeight,
            }}
          >
            {items.map((item, index) => (
              <span key={index} style={{ display: "inline-flex", alignItems: "center" }}>
                {index > 0 && <span style={{ color: "#d1d5db", padding: "0 8px" }}>·</span>}
                <span style={{ color: empty ? "#9ca3af" : block.color, whiteSpace: "nowrap" }}>
                  {item.label}
                </span>
              </span>
            ))}
          </div>
        </div>
      )
    }

    case "social": {
      const items = parsePairs(block.text)
      return (
        <div style={{ padding, fontFamily }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: justify }}>
            {items.map((item, index) => {
              const badge = socialBadge(item.label)
              return (
                <span
                  key={index}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: badge.bg,
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {badge.label}
                </span>
              )
            })}
          </div>
        </div>
      )
    }

    case "columns": {
      const colMax = Math.floor(
        (EMAIL_WIDTH - x * 2) / Math.max(1, block.children.length),
      )
      const fit = (child: Block): Block =>
        child.type === "image"
          ? {
              ...child,
              width: Math.min(child.width, Math.max(40, colMax - blockSpacing(child, doc).x * 2)),
            }
          : child
      return (
        <div style={{ padding, fontFamily }}>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            {block.children.map((child) => (
              <div
                key={child.id}
                style={{ width: `${100 / Math.max(1, block.children.length)}%`, minWidth: 0 }}
              >
                <BlockPreview block={fit(child)} doc={doc} />
              </div>
            ))}
          </div>
        </div>
      )
    }

    case "image":
    default:
      return (
        <div style={{ padding, fontFamily, display: "flex", justifyContent: justify }}>
          {block.src.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.src}
              alt={block.alt}
              style={{
                display: "block",
                width: Math.min(block.width, EMAIL_WIDTH - x * 2),
                maxWidth: "100%",
                height: "auto",
              }}
            />
          ) : (
            <div className="flex w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-neutral-300 bg-neutral-50 py-10 text-center text-neutral-400">
              <ImageOff className="size-5" />
              <span className="text-xs">Add an image URL in the panel</span>
            </div>
          )}
        </div>
      )
  }
})

type Tab = "element" | "body"

function Inspector() {
  const selectedId = useBuilder((state) => state.selectedId)
  const block = useBuilder((state) => state.blocks.find((b) => b.id === selectedId) ?? null)
  const [tab, setTab] = useState<Tab>(selectedId ? "element" : "body")

  const [prevSelected, setPrevSelected] = useState(selectedId)
  if (selectedId !== prevSelected) {
    setPrevSelected(selectedId)
    setTab(selectedId ? "element" : "body")
  }

  return (
    <aside className="hidden min-h-0 flex-col overflow-hidden border-l border-border bg-background sm:flex">
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as Tab)}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="flex h-12 shrink-0 items-center border-b border-border px-4">
          <TabsList className="w-full">
            <TabsTrigger value="element" disabled={!selectedId}>
              Element
            </TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="element" className="min-h-0 flex-1 overflow-y-auto">
          {block ? <BlockInspector block={block} /> : null}
        </TabsContent>

        <TabsContent value="body" className="min-h-0 flex-1 overflow-y-auto">
          <BodyInspector />
        </TabsContent>
      </Tabs>
    </aside>
  )
}

function BlockInspector({ block }: { block: Block }) {
  const update = useBuilder((state) => state.update)
  const reset = useBuilder((state) => state.reset)
  const remove = useBuilder((state) => state.remove)

  const doc = useBuilder((state) => state.doc)
  const set = (patch: Partial<Block>, tag?: string | null) => update(block.id, patch, tag)
  const imageMax = EMAIL_WIDTH - blockSpacing(block, doc).x * 2
  const isText = block.type === "heading" || block.type === "text" || block.type === "richtext"
  const meta = META[block.type]
  const TypeIcon = meta.icon
  const hasColor =
    isText || ["button", "list", "table", "quote", "callout", "menu", "divider"].includes(block.type)
  const hasSpacing = block.type !== "spacer"
  const hasDimension =
    isText ||
    ["button", "image", "list", "table", "quote", "callout", "menu", "divider", "spacer"].includes(
      block.type,
    )
  const hasSize = hasDimension || hasSpacing
  const hasFont =
    isText || ["list", "quote", "callout", "table", "button", "menu"].includes(block.type)
  const hasAlign = !["divider", "columns", "spacer"].includes(block.type)
  const hasTypeOptions = ["button", "list", "table"].includes(block.type)
  const hasSelects = hasFont || hasAlign || hasTypeOptions

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background px-4 py-3">
        <TypeIcon className="size-4 text-primary" />
        <span className="text-sm font-medium">{meta.label}</span>
      </div>
      <div className="flex flex-col gap-4 p-4">
        {isText && (
          <Field label="Content">
            {block.type === "richtext" ? (
              <RichTextField key={block.id} value={block.html} onChange={(html) => set({ html })} />
            ) : (
              <Textarea
                value={block.text}
                onChange={(e) => set({ text: e.target.value })}
                rows={4}
                placeholder={PLACEHOLDERS[block.type]}
              />
            )}
          </Field>
        )}
        {block.type === "button" && (
          <>
            <Field label="Label">
              <Input value={block.text} onChange={(e) => set({ text: e.target.value })} placeholder={PLACEHOLDERS.button} />
            </Field>
            <Field label="Link URL">
              <Input value={block.href} onChange={(e) => set({ href: e.target.value })} placeholder="https://…" />
            </Field>
          </>
        )}
        {block.type === "image" && (
          <>
            <Field label="Image URL">
              <Input value={block.src} onChange={(e) => set({ src: e.target.value })} placeholder="https://…/photo.png" />
            </Field>
            <Field label="Alt text">
              <Input value={block.alt} onChange={(e) => set({ alt: e.target.value })} placeholder="Alt text" />
            </Field>
            <Field label="Link URL (optional)">
              <Input value={block.href} onChange={(e) => set({ href: e.target.value })} placeholder="https://…" />
            </Field>
          </>
        )}
        {block.type === "list" && (
          <Field label="Items">
            <Textarea value={block.text} onChange={(e) => set({ text: e.target.value })} rows={5} placeholder={PLACEHOLDERS.list} />
          </Field>
        )}
        {block.type === "table" && (
          <Field label="Table">
            <TableEditor value={block.text} onChange={(text) => set({ text })} />
          </Field>
        )}
        {block.type === "quote" && (
          <>
            <Field label="Quote">
              <Textarea value={block.text} onChange={(e) => set({ text: e.target.value })} rows={4} placeholder={PLACEHOLDERS.quote} />
            </Field>
            <Field label="Author">
              <Input value={block.author} onChange={(e) => set({ author: e.target.value })} placeholder="Author (optional)" />
            </Field>
          </>
        )}
        {block.type === "callout" && (
          <Field label="Content">
            <Textarea value={block.text} onChange={(e) => set({ text: e.target.value })} rows={3} placeholder={PLACEHOLDERS.callout} />
          </Field>
        )}
        {block.type === "menu" && (
          <Field label="Links">
            <LinkRowsField value={block.text} onChange={(text) => set({ text })} labelPlaceholder="Label" addLabel="Add link" />
          </Field>
        )}
        {block.type === "social" && (
          <>
            <Field label="Profiles">
              <LinkRowsField value={block.text} onChange={(text) => set({ text })} labelPlaceholder="network" addLabel="Add profile" />
            </Field>
            <p className="-mt-1 text-xs text-muted-foreground">
              Known: x, instagram, facebook, linkedin, youtube, tiktok, github, email, website.
            </p>
          </>
        )}
        {block.type === "columns" && <ColumnsFields block={block} set={set} />}
      </div>

      <div className="flex flex-col">
        {hasColor && (
          <InspectorGroup>
            {(isText || block.type === "callout") && (
              <>
                <ColorField label="Text" value={block.color} onChange={(color) => set({ color })} />
                <ColorField label="Background" value={block.background} onChange={(background) => set({ background })} />
              </>
            )}
            {block.type === "button" && (
              <>
                <ColorField label="Text" value={block.color} onChange={(color) => set({ color })} />
                <ColorField label="Background" value={block.background} onChange={(background) => set({ background })} />
              </>
            )}
            {(block.type === "list" || block.type === "menu" || block.type === "divider") && (
              <ColorField label="Colour" value={block.color} onChange={(color) => set({ color })} />
            )}
            {block.type === "table" && (
              <ColorField label="Text" value={block.color} onChange={(color) => set({ color })} />
            )}
            {block.type === "quote" && (
              <>
                <ColorField label="Text" value={block.color} onChange={(color) => set({ color })} />
                <ColorField label="Author" value={block.authorColor} onChange={(authorColor) => set({ authorColor })} />
                <ColorField label="Accent" value={block.background} onChange={(background) => set({ background })} />
              </>
            )}
          </InspectorGroup>
        )}

        {hasSize && (
          <InspectorGroup>
            {!hasDimension ? null : block.type === "image" ? (
              <SliderField label="Width" value={Math.min(block.width, imageMax)} min={80} max={imageMax} step={1} suffix="px" onChange={(width) => set({ width })} />
            ) : block.type === "divider" ? (
              <SliderField label="Thickness" value={block.thickness} min={1} max={8} step={1} suffix="px" onChange={(thickness) => set({ thickness })} />
            ) : block.type === "spacer" ? (
              <SliderField label="Height" value={block.height} min={8} max={120} step={2} suffix="px" onChange={(height) => set({ height })} />
            ) : (
              <>
                <SliderField label="Size" value={block.fontSize} min={12} max={56} step={1} suffix="px" onChange={(fontSize) => set({ fontSize })} />
                {(block.type === "heading" || block.type === "text" || block.type === "button" || block.type === "menu") && (
                  <WeightField value={block.fontWeight} onChange={(fontWeight) => set({ fontWeight })} />
                )}
                {(block.type === "text" || block.type === "richtext" || block.type === "quote" || block.type === "callout") && (
                  <SliderField label="Line height" value={block.lineHeight} min={1} max={2.4} step={0.1} format={(v) => v.toFixed(1)} onChange={(lineHeight) => set({ lineHeight })} />
                )}
                {(block.type === "button" || block.type === "callout") && (
                  <SliderField label="Corner radius" value={block.radius} min={0} max={28} step={1} suffix="%" format={(v) => `${Math.round((v / 28) * 100)}`} onChange={(radius) => set({ radius })} />
                )}
              </>
            )}
            {hasSpacing && <SpacingFields block={block} doc={doc} set={set} />}
          </InspectorGroup>
        )}

        {hasSelects && (
          <InspectorGroup>
            {hasFont && <FontField value={block.fontFamily} doc={doc} onChange={(fontFamily) => set({ fontFamily })} />}
            {hasAlign && (
              <Field label="Alignment">
                <AlignPicker value={block.align} onChange={(align) => set({ align })} />
              </Field>
            )}
            {block.type === "button" && (
              <Field label="Width">
                <NativeSelect className="w-full" value={block.fullWidth ? "full" : "auto"} onChange={(e) => set({ fullWidth: e.target.value === "full" })}>
                  <NativeSelectOption value="auto">Auto</NativeSelectOption>
                  <NativeSelectOption value="full">Full width</NativeSelectOption>
                </NativeSelect>
              </Field>
            )}
            {block.type === "list" && (
              <Field label="Style">
                <NativeSelect className="w-full" value={block.listStyle} onChange={(e) => set({ listStyle: e.target.value as Block["listStyle"] })}>
                  <NativeSelectOption value="bulleted">Bulleted</NativeSelectOption>
                  <NativeSelectOption value="numbered">Numbered</NativeSelectOption>
                  <NativeSelectOption value="none">None</NativeSelectOption>
                </NativeSelect>
              </Field>
            )}
            {block.type === "table" && (
              <>
                <Field label="Header row">
                  <NativeSelect className="w-full" value={block.headerRow ? "on" : "off"} onChange={(e) => set({ headerRow: e.target.value === "on" })}>
                    <NativeSelectOption value="on">Bold first row</NativeSelectOption>
                    <NativeSelectOption value="off">No header</NativeSelectOption>
                  </NativeSelect>
                </Field>
                <Field label="Borders">
                  <NativeSelect className="w-full" value={block.borders ? "on" : "off"} onChange={(e) => set({ borders: e.target.value === "on" })}>
                    <NativeSelectOption value="on">Show cell borders</NativeSelectOption>
                    <NativeSelectOption value="off">No borders</NativeSelectOption>
                  </NativeSelect>
                </Field>
              </>
            )}
          </InspectorGroup>
        )}
      </div>

      <div className="flex gap-2 border-t border-border p-4">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => reset(block.id)}>
          <RotateCcw data-icon="inline-start" />
          Reset
        </Button>
        <Button variant="destructive" size="sm" className="flex-1" onClick={() => remove(block.id)}>
          <Trash2 data-icon="inline-start" />
          Delete
        </Button>
      </div>
    </div>
  )
}

function ColumnsFields({
  block,
  set,
}: {
  block: Block
  set: (patch: Partial<Block>, tag?: string | null) => void
}) {
  const doc = useBuilder((state) => state.doc)
  const children = block.children
  const recap = (kids: Block[]): Block[] => {
    const max = Math.max(
      80,
      Math.floor((EMAIL_WIDTH - blockSpacing(block, doc).x * 2) / Math.max(1, kids.length)) -
        doc.spacingX * 2,
    )
    return kids.map((child) =>
      child.type === "image" ? { ...child, width: Math.min(child.width, max) } : child,
    )
  }
  const setChild = (index: number, patch: Partial<Block>) =>
    set(
      { children: children.map((child, i) => (i === index ? { ...child, ...patch } : child)) },
      `update:${block.id}:child:${children[index].id}:${Object.keys(patch).sort().join(",")}`,
    )
  const setType = (index: number, type: BlockType) => {
    const fresh = makeColumnChild(type)
    const sized = type === "image" ? { ...fresh, width: columnContentWidth(children.length, doc.spacingX) } : fresh
    set({ children: children.map((child, i) => (i === index ? sized : child)) }, null)
  }
  const addColumn = () => set({ children: recap([...children, makeColumnChild("text")]) }, null)
  const removeColumn = (index: number) =>
    set({ children: recap(children.filter((_, i) => i !== index)) }, null)
  const imgMax = Math.max(
    80,
    Math.floor((EMAIL_WIDTH - blockSpacing(block, doc).x * 2) / Math.max(1, children.length)) -
      doc.spacingX * 2,
  )

  return (
    <div className="flex flex-col gap-3">
      {children.map((child, index) => (
        <div key={child.id} className="flex flex-col gap-3">
          {index > 0 && <div aria-hidden className="mx-1 border-t border-border" />}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Column {index + 1}</span>
            {children.length > 1 && (
              <button
                type="button"
                aria-label="Remove column"
                onClick={() => removeColumn(index)}
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground/60 transition hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Field label="Type">
            <NativeSelect
              className="w-full"
              value={child.type}
              onChange={(e) => setType(index, e.target.value as BlockType)}
            >
              {COLUMN_TYPES.map((type) => (
                <NativeSelectOption key={type} value={type}>
                  {META[type].label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <ColumnChildFields child={child} imgMax={imgMax} onChange={(patch) => setChild(index, patch)} />
          <Field label="Align">
            <AlignPicker value={child.align} onChange={(align) => setChild(index, { align })} />
          </Field>
        </div>
      ))}
      {children.length < 3 && (
        <Button variant="outline" size="sm" className="w-full" onClick={addColumn}>
          <Plus data-icon="inline-start" />
          Add column
        </Button>
      )}
    </div>
  )
}

function ColumnChildFields({
  child,
  imgMax,
  onChange,
}: {
  child: Block
  imgMax: number
  onChange: (patch: Partial<Block>) => void
}) {
  switch (child.type) {
    case "heading":
      return (
        <>
          <Field label="Text">
            <Input value={child.text} onChange={(e) => onChange({ text: e.target.value })} placeholder={PLACEHOLDERS.heading} />
          </Field>
          <ColorField label="Colour" value={child.color} onChange={(color) => onChange({ color })} />
          <SliderField label="Size" value={child.fontSize} min={12} max={40} step={1} suffix="px" onChange={(fontSize) => onChange({ fontSize })} />
        </>
      )
    case "image":
      return (
        <>
          <Field label="Image URL">
            <Input value={child.src} onChange={(e) => onChange({ src: e.target.value })} placeholder="https://…/photo.png" />
          </Field>
          <Field label="Alt text">
            <Input value={child.alt} onChange={(e) => onChange({ alt: e.target.value })} placeholder="Alt text" />
          </Field>
          <Field label="Link URL (optional)">
            <Input value={child.href} onChange={(e) => onChange({ href: e.target.value })} placeholder="https://…" />
          </Field>
          <SliderField label="Width" value={Math.min(child.width, imgMax)} min={40} max={imgMax} step={1} suffix="px" onChange={(width) => onChange({ width })} />
        </>
      )
    case "button":
      return (
        <>
          <Field label="Label">
            <Input value={child.text} onChange={(e) => onChange({ text: e.target.value })} placeholder={PLACEHOLDERS.button} />
          </Field>
          <Field label="Link URL">
            <Input value={child.href} onChange={(e) => onChange({ href: e.target.value })} placeholder="https://…" />
          </Field>
          <ColorField label="Text" value={child.color} onChange={(color) => onChange({ color })} />
          <ColorField label="Background" value={child.background} onChange={(background) => onChange({ background })} />
        </>
      )
    case "text":
    default:
      return (
        <>
          <Field label="Content">
            <Textarea value={child.text} onChange={(e) => onChange({ text: e.target.value })} rows={3} placeholder={PLACEHOLDERS.text} />
          </Field>
          <ColorField label="Colour" value={child.color} onChange={(color) => onChange({ color })} />
          <SliderField label="Size" value={child.fontSize} min={12} max={40} step={1} suffix="px" onChange={(fontSize) => onChange({ fontSize })} />
        </>
      )
  }
}

function BodyInspector() {
  const doc = useBuilder((state) => state.doc)
  const updateDoc = useBuilder((state) => state.updateDoc)

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 p-4">
        <Field label="Title">
          <Input value={doc.title} onChange={(e) => updateDoc({ title: e.target.value })} placeholder="Email title" />
        </Field>
        <Field label="Description">
          <Textarea value={doc.description} onChange={(e) => updateDoc({ description: e.target.value })} rows={2} placeholder="Preview text" />
        </Field>
      </div>

      <InspectorGroup>
        <ColorField label="Canvas" value={doc.background} onChange={(background) => updateDoc({ background })} />
        <ColorField label="Background" value={doc.contentBackground} onChange={(contentBackground) => updateDoc({ contentBackground })} />
      </InspectorGroup>

      <InspectorGroup>
        <SliderField label="Horizontal" value={doc.spacingX} min={0} max={64} step={2} suffix="px" onChange={(spacingX) => updateDoc({ spacingX })} />
        <SliderField label="Vertical" value={doc.spacingY} min={0} max={64} step={2} suffix="px" onChange={(spacingY) => updateDoc({ spacingY })} />
      </InspectorGroup>

      <InspectorGroup>
        <FontField
          value={doc.fontFamily}
          doc={doc}
          inheritable={false}
          onChange={(fontFamily) => updateDoc({ fontFamily: fontFamily ?? "system" })}
        />
      </InspectorGroup>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function InspectorGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 border-t border-border px-4 py-4">{children}</div>
}

function FontField({
  value,
  doc,
  onChange,
  inheritable = true,
  label = "Font",
}: {
  value: FontKey | null
  doc: Doc
  onChange: (value: FontKey | null) => void
  inheritable?: boolean
  label?: string
}) {
  return (
    <Field label={label}>
      <NativeSelect
        className="w-full"
        value={value ?? "inherit"}
        onChange={(event) =>
          onChange(event.target.value === "inherit" ? null : (event.target.value as FontKey))
        }
        style={{ fontFamily: FONTS[value ?? doc.fontFamily].stack }}
      >
        {inheritable && (
          <NativeSelectOption value="inherit">
            Match body — {FONTS[doc.fontFamily].label}
          </NativeSelectOption>
        )}
        {FONT_KEYS.map((key) => (
          <NativeSelectOption key={key} value={key} style={{ fontFamily: FONTS[key].stack }}>
            {FONTS[key].label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  )
}

function SpacingFields({
  block,
  doc,
  set,
}: {
  block: Block
  doc: Doc
  set: (patch: Partial<Block>, tag?: string | null) => void
}) {
  const { x, y } = blockSpacing(block, doc)
  const linked = block.spacingX === null && block.spacingY === null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`spacing-${block.id}`} className="text-xs font-medium text-muted-foreground">
          Spacing
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Match body</span>
          <Switch
            id={`spacing-${block.id}`}
            checked={linked}
            onCheckedChange={(on) =>
              set(on ? { spacingX: null, spacingY: null } : { spacingX: x, spacingY: y }, null)
            }
          />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <SliderField label="Horizontal" value={x} min={0} max={64} step={2} suffix="px" disabled={linked} onChange={(spacingX) => set({ spacingX })} />
        <SliderField label="Vertical" value={y} min={0} max={64} step={2} suffix="px" disabled={linked} onChange={(spacingY) => set({ spacingY })} />
      </div>
    </div>
  )
}

function LinkRowsField({
  value,
  onChange,
  labelPlaceholder,
  addLabel,
}: {
  value: string
  onChange: (value: string) => void
  labelPlaceholder: string
  addLabel: string
}) {
  const rows = (value.length ? value.split("\n") : [""]).map((line) => {
    const [label, url] = line.split("|")
    return { label: (label ?? "").trim(), url: (url ?? "").trim() }
  })
  const serialize = (rs: { label: string; url: string }[]) =>
    rs.map((r) => (r.url ? `${r.label} | ${r.url}` : r.label)).join("\n")
  const setRow = (i: number, patch: Partial<{ label: string; url: string }>) =>
    onChange(serialize(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r))))

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Input
            className="w-0 flex-1"
            value={row.label}
            onChange={(e) => setRow(i, { label: e.target.value })}
            placeholder={labelPlaceholder}
          />
          <Input
            className="w-0 flex-[1.4]"
            value={row.url}
            onChange={(e) => setRow(i, { url: e.target.value })}
            placeholder="https://…"
          />
          <button
            type="button"
            aria-label="Remove"
            disabled={rows.length <= 1}
            onClick={() => onChange(serialize(rows.filter((_, idx) => idx !== i)))}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => onChange(serialize([...rows, { label: "", url: "" }]))}
      >
        <Plus data-icon="inline-start" />
        {addLabel}
      </Button>
    </div>
  )
}

function WeightField({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <Field label="Weight">
      <NativeSelect className="w-full" value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {FONT_WEIGHTS.map((weight) => (
          <NativeSelectOption key={weight.value} value={weight.value}>
            {weight.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  )
}

function TableEditor({ value, onChange }: { value: string; onChange: (text: string) => void }) {
  const parsed = value.trim() ? value.split(/\r?\n/).map((row) => row.split(" | ")) : [["", ""]]
  const cols = Math.max(1, ...parsed.map((row) => row.length))
  const rows = parsed.map((row) => {
    const cells = [...row]
    while (cells.length < cols) cells.push("")
    return cells
  })

  const commit = (next: string[][]) => onChange(next.map((row) => row.join(" | ")).join("\n"))
  const setCell = (ri: number, ci: number, v: string) => {
    const next = rows.map((row) => [...row])
    next[ri][ci] = v
    commit(next)
  }
  const addRow = () => commit([...rows, Array<string>(cols).fill("")])
  const addCol = () => commit(rows.map((row) => [...row, ""]))
  const removeRow = (ri: number) => {
    if (rows.length > 1) commit(rows.filter((_, i) => i !== ri))
  }
  const removeCol = (ci: number) => {
    if (cols > 1) commit(rows.map((row) => row.filter((_, i) => i !== ci)))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/40">
              {rows[0].map((_, ci) => (
                <th key={ci} className="border-r border-b border-border p-0 font-normal">
                  <button
                    type="button"
                    onClick={() => removeCol(ci)}
                    disabled={cols <= 1}
                    aria-label={`Remove column ${ci + 1}`}
                    className="flex h-6 w-full items-center justify-center text-muted-foreground/60 transition hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
                  >
                    <X className="size-3" />
                  </button>
                </th>
              ))}
              <th className="w-8 border-b border-border p-0">
                <button
                  type="button"
                  onClick={addCol}
                  aria-label="Add column"
                  className="flex h-6 w-full items-center justify-center text-muted-foreground transition hover:text-primary"
                >
                  <Plus className="size-3.5" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className="border-r border-b border-border p-0">
                    <input
                      value={cell}
                      onChange={(event) => setCell(ri, ci, event.target.value)}
                      placeholder="…"
                      className="w-full min-w-24 bg-transparent px-2.5 py-2 outline-none focus:bg-primary/5"
                    />
                  </td>
                ))}
                <td className="w-8 border-b border-border p-0">
                  <button
                    type="button"
                    onClick={() => removeRow(ri)}
                    disabled={rows.length <= 1}
                    aria-label={`Remove row ${ri + 1}`}
                    className="flex size-8 items-center justify-center text-muted-foreground/60 transition hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
                  >
                    <X className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" size="sm" className="w-full" onClick={addRow}>
        <Plus data-icon="inline-start" />
        Add row
      </Button>
    </div>
  )
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  format,
  disabled,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  format?: (value: number) => string
  disabled?: boolean
  onChange: (value: number) => void
}) {
  const text = `${format ? format(value) : value}${suffix}`
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        <span className="text-xs tabular-nums text-muted-foreground">{text}</span>
      </div>
      <Slider
        disabled={disabled}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        formatTooltip={(v) => `${format ? format(v) : v}${suffix}`}
      />
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const isTransparent = !value || value === "transparent"
  const swatch = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#ffffff"
  const display = isTransparent ? "Transparent" : value.toUpperCase()
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input
          type="color"
          value={swatch}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className="size-9 shrink-0 cursor-pointer overflow-hidden rounded-full border border-border bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0"
        />
        <Input
          value={display}
          onChange={(event) => onChange(event.target.value)}
          className="font-mono"
          spellCheck={false}
        />
      </div>
    </Field>
  )
}

const ALIGNMENTS: { value: Align; icon: typeof AlignLeft; label: string }[] = [
  { value: "left", icon: AlignLeft, label: "Left" },
  { value: "center", icon: AlignCenter, label: "Center" },
  { value: "right", icon: AlignRight, label: "Right" },
]

function AlignPicker({ value, onChange }: { value: Align; onChange: (value: Align) => void }) {
  const { ref, pill } = useIndicator<HTMLDivElement>({
    active: '[data-align][data-active="true"]',
    item: "[data-align]",
    axis: "x",
  })

  return (
    <div
      ref={ref}
      role="radiogroup"
      className="relative inline-flex h-9 w-full items-center rounded-full bg-muted p-[3px] text-muted-foreground"
    >
      <span {...pill("rounded-full bg-primary")} />
      {ALIGNMENTS.map(({ value: option, icon: Icon, label }) => {
        const active = option === value
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            data-align
            data-active={active}
            onClick={() => onChange(option)}
            className="relative z-10 inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center rounded-full transition-colors select-none"
          >
            <IndicatorFill layout="inline-flex items-center justify-center">
              <Icon className="size-4" />
            </IndicatorFill>
          </button>
        )
      })}
    </div>
  )
}
