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
  ArrowDown,
  ArrowUp,
  Bookmark,
  Check,
  ChevronLeft,
  Copy as CopyIcon,
  Download,
  Eye,
  GripVertical,
  ImageOff,
  Mail,
  Maximize2,
  Minimize2,
  Monitor,
  Moon,
  Plus,
  Redo2,
  SlidersHorizontal,
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
  columnsInset,
  columnWidth,
  EMAIL_WIDTH,
  inColumn,
  META,
  parsePairs,
  PLACEHOLDERS,
  socialBadge,
  useBuilder,
  type Block,
  type Doc,
} from "@/components/builder/store"
import { renderEmailHtml } from "@/components/builder/export"
import { DARK_INK, LIGHT_INK, type Ink } from "@/components/builder/dark"
import { APP_NAME } from "@/core/meta"
import { HighlightedHtml } from "@/components/builder/highlight"
import { DROP_INSET, PaletteDndProvider, usePaletteDnd } from "@/components/builder/palette-dnd"
import { PaletteContent } from "@/components/builder/palette"
import { InspectorPanel } from "@/components/builder/inspector"
import { InboxPreview } from "@/components/builder/inbox-preview"

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
          {/* Three columns only where three columns fit. Below that, the canvas
              takes the width and the palette and inspector open as sheets. */}
          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[17rem_minmax(0,1fr)_19rem] xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
            <aside
              aria-label="Blocks"
              className="hidden min-h-0 flex-col overflow-hidden border-r border-border bg-background lg:flex"
            >
              <PaletteContent />
            </aside>
            <Canvas />
            <aside
              aria-label="Inspector"
              className="hidden min-h-0 flex-col overflow-hidden border-l border-border bg-background lg:flex"
            >
              <InspectorPanel />
            </aside>
          </div>
          <CompactPanels />
        </div>
      </PaletteDndProvider>
    </PreviewProvider>
  )
}

// Below the three-column width: an "Add block" button for the palette and an
// "Edit" button for the inspector, each opening its panel as a sheet.
function CompactPanels() {
  const [panel, setPanel] = useState<"blocks" | "edit" | null>(null)
  const selected = useBuilder((state) => state.selectedId !== null)

  return (
    <>
      <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-40 flex gap-2 lg:hidden print:hidden">
        <Button className="h-11 rounded-full px-4 shadow-lg" onClick={() => setPanel("blocks")}>
          <Plus data-icon="inline-start" />
          Add block
        </Button>
        <Button
          variant="outline"
          className="h-11 rounded-full bg-background px-4 shadow-lg dark:bg-background"
          onClick={() => setPanel("edit")}
        >
          <SlidersHorizontal data-icon="inline-start" />
          {selected ? "Edit block" : "Email"}
        </Button>
      </div>

      <Sheet open={panel === "blocks"} onOpenChange={(open) => !open && setPanel(null)}>
        <SheetContent side="left" className="w-[19rem] gap-0 p-0 sm:max-w-[19rem]">
          <SheetHeader className="sr-only">
            <SheetTitle>Blocks</SheetTitle>
            <SheetDescription>Tap a block to add it to the email.</SheetDescription>
          </SheetHeader>
          <PaletteContent compact onPick={() => setPanel(null)} />
        </SheetContent>
      </Sheet>

      <Sheet open={panel === "edit"} onOpenChange={(open) => !open && setPanel(null)}>
        <SheetContent side="right" className="w-[21rem] gap-0 p-0 sm:max-w-[21rem]">
          <SheetHeader className="sr-only">
            <SheetTitle>Inspector</SheetTitle>
            <SheetDescription>Edit the selected block or the email.</SheetDescription>
          </SheetHeader>
          <InspectorPanel inSheet />
        </SheetContent>
      </Sheet>
    </>
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
  const [inboxOpen, setInboxOpen] = useState(false)
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
      <span className="mr-auto min-w-0 truncate text-sm font-medium">
        <span className="hidden sm:inline">Email Editor</span>
      </span>

      <motion.div
        layout
        transition={TOOLBAR_SPRING}
        className="flex items-center gap-1 self-stretch"
      >
        <PreviewToggle />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!hasBlocks}
              onClick={() => setInboxOpen(true)}
              aria-label="Preview"
            >
              <Eye />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Preview</TooltipContent>
        </Tooltip>
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
              <Button key="copy" variant="ghost" size="sm" onClick={() => setPreview(build())} aria-label="Copy HTML">
                <CopyIcon />
                <span className="hidden md:inline">Copy</span>
              </Button>,
              <Button key="save" variant="secondary" size="sm" disabled className="hidden md:inline-flex">
                <Bookmark data-icon="inline-start" />
                Save
              </Button>,
              <Button key="dl" size="sm" onClick={() => setDownloadOpen(true)} aria-label="Download HTML">
                <Download />
                <span className="hidden sm:inline">Download</span>
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
      <InboxPreview open={inboxOpen} onOpenChange={setInboxOpen} />

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
// Mobile is the email's column on a 390px phone, after the email's 12px side gutters.
const PREVIEW_WIDTH: Record<Preview, number> = { desktop: EMAIL_WIDTH, mobile: 366 }

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

// The email's colours for this render: as designed, or their dark-mode
// counterparts when the editor is dark and the email adapts (see dark.ts) — the
// same mapping the exported HTML ships, so a dark editor shows the dark inbox.
const InkContext = createContext<Ink>(LIGHT_INK)

function useEmailInk(doc: Doc): Ink {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])
  return mounted && resolvedTheme === "dark" && doc.darkMode !== "fixed" ? DARK_INK : LIGHT_INK
}

function Canvas() {
  const blocks = useBuilder((state) => state.blocks)
  const reorder = useBuilder((state) => state.reorder)
  const select = useBuilder((state) => state.select)
  const doc = useBuilder((state) => state.doc)
  const ink = useEmailInk(doc)

  const order = blocks.map((block) => block.id)

  const { contentRef, zoneRef, active: draggingType, dropY } = usePaletteDnd()
  const { preview } = useContext(PreviewContext)

  const reorderY = useMotionValue(0)
  const reorderOn = useMotionValue(0)

  const wall = ink.fill(doc.background)
  const paper = ink.fill(doc.contentBackground)

  return (
    <InkContext value={ink}>
      <motion.div
        ref={zoneRef}
        layoutScroll
        className="min-w-0 overflow-y-auto bg-size-[16px_16px]"
        style={{
          backgroundColor: wall,
          backgroundImage: `radial-gradient(${dotColor(wall)} 1px, transparent 1px)`,
        }}
        onClick={() => select(null)}
      >
        <div
          className="mx-auto flex min-h-full w-full flex-col px-[30px] pt-[30px] pb-28 transition-[max-width] duration-300 ease-out motion-reduce:transition-none lg:pb-[30px]"
          style={{ maxWidth: PREVIEW_WIDTH[preview] + 60 }}
        >
          {blocks.length === 0 ? (
            <Empty
              ref={contentRef}
              className={cn(
                "mx-auto w-full border border-dashed transition-[max-width,border-color] duration-300 ease-out motion-reduce:transition-none",
                draggingType !== null && "border-primary",
              )}
              // The empty state IS the paper, so it wears the document's own colour
              // (through the same ink as the blocks), not the app's: an email is the
              // colour it is in an inbox.
              style={{
                maxWidth: PREVIEW_WIDTH[preview],
                backgroundColor: paper,
                borderColor: draggingType !== null ? undefined : ink.fill("#d4d4d4"),
              }}
            >
              <EmptyHeader
                className={cn(
                  "transition-opacity duration-200 ease-out",
                  draggingType !== null && "opacity-25",
                )}
              >
                <EmptyMedia className="text-primary">
                  <Mail className="size-12" />
                </EmptyMedia>
                <EmptyTitle
                  className="text-base"
                  style={{ color: ink.text("#171717", doc.contentBackground) }}
                >
                  Your email is empty
                </EmptyTitle>
                <EmptyDescription
                  className="max-w-56"
                  style={{ color: ink.text("#737373", doc.contentBackground) }}
                >
                  Add a block from the palette, or drag one anywhere onto this canvas.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div
              ref={contentRef}
              className="relative mx-auto w-full transition-[max-width] duration-300 ease-out motion-reduce:transition-none"
              style={{ maxWidth: PREVIEW_WIDTH[preview], backgroundColor: paper }}
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
                    contentBackground={paper}
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
    </InkContext>
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

// How a block looks in the email, drawn on the canvas. Mirrors the exporter
// (components/builder/export.ts): the same spacing, the same column geometry, the
// same fixed colours — all read through the ink, so a dark editor shows the dark
// inbox version.
const PLACEHOLDER_INK = "#9ca3af"
const TABLE_BORDER = "#e5e7eb"
const TABLE_HEADER_BG = "#f9fafb"
const MENU_DOT = "#d1d5db"
const LINK = "#2563eb"

const BlockPreview = memo(function BlockPreviewImpl({ block, doc }: { block: Block; doc: Doc }) {
  const ink = useContext(InkContext)
  const { x, y } = blockSpacing(block, doc)
  const padding = `${y}px ${x}px`
  const fontFamily = blockFont(block, doc)
  const hasBand = Boolean(block.background) && block.background !== "transparent"
  const band = hasBand ? ink.fill(block.background) : undefined
  // The fill this block's text sits on — its own band, or the paper.
  const ground = hasBand ? block.background : doc.contentBackground
  const color = ink.text(block.color, ground)
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
            color,
            fontSize: block.fontSize,
            lineHeight: 1.3,
            fontWeight: block.fontWeight,
            textAlign: block.align,
            whiteSpace: "pre-wrap",
            overflowWrap: "break-word",
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
            color,
            fontSize: block.fontSize,
            lineHeight: block.lineHeight,
            fontWeight: block.fontWeight,
            textAlign: block.align,
            whiteSpace: "pre-wrap",
            overflowWrap: "break-word",
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
        color,
        fontSize: block.fontSize,
        lineHeight: block.lineHeight,
        textAlign: block.align,
        overflowWrap: "break-word" as const,
        "--link": ink.text(LINK, ground),
      } as React.CSSProperties
      return emptyRich ? (
        <div style={richStyle}>{PLACEHOLDERS.richtext}</div>
      ) : (
        <div
          className="[&_a]:text-(--link) [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:m-0 [&_p:not(:last-child)]:mb-4 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-6"
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
              maxWidth: "100%",
              boxSizing: "border-box",
              textAlign: "center",
              padding: "12px 24px",
              backgroundColor: ink.fill(block.background),
              color: ink.text(block.color, block.background),
              fontSize: block.fontSize,
              fontWeight: block.fontWeight,
              lineHeight: 1,
              borderRadius: block.radius,
              overflowWrap: "break-word",
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
          <div style={{ borderTop: `${block.thickness}px solid ${ink.fill(block.color)}` }} />
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
              color: empty ? ink.text(PLACEHOLDER_INK, ground) : color,
              fontSize: block.fontSize,
              lineHeight: block.lineHeight,
              textAlign: block.align,
              overflowWrap: "break-word",
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
      const cellBorder = block.borders ? `1px solid ${ink.fill(TABLE_BORDER)}` : undefined
      return (
        <div style={{ padding, fontFamily, backgroundColor: band }}>
          {rows ? (
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
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
                            backgroundColor: header ? ink.fill(TABLE_HEADER_BG) : undefined,
                            padding: "8px 12px",
                            color: ink.text(block.color, header ? TABLE_HEADER_BG : ground),
                            fontSize: block.fontSize,
                            lineHeight: 1.4,
                            fontWeight: header ? 700 : block.fontWeight,
                            textAlign: block.align,
                            overflowWrap: "break-word",
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
                color: ink.text(PLACEHOLDER_INK, ground),
                fontSize: block.fontSize,
                lineHeight: 1.4,
                whiteSpace: "pre-wrap",
                overflowWrap: "break-word",
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
          <div style={{ borderLeft: `4px solid ${ink.fill(block.background)}`, paddingLeft: 16 }}>
            <div
              style={{
                color: ink.text(block.color, doc.contentBackground),
                fontSize: block.fontSize,
                lineHeight: block.lineHeight,
                fontStyle: "italic",
                textAlign: block.align,
                whiteSpace: "pre-wrap",
                overflowWrap: "break-word",
              }}
            >
              {block.text || PLACEHOLDERS.quote}
            </div>
            {block.author.trim() && (
              <div
                style={{
                  marginTop: 8,
                  color: ink.text(block.authorColor, doc.contentBackground),
                  fontSize: Math.max(12, Math.round(block.fontSize * 0.75)),
                  lineHeight: 1.4,
                  textAlign: block.align,
                  overflowWrap: "break-word",
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
              backgroundColor: ink.fill(block.background),
              color: ink.text(block.color, block.background),
              borderRadius: block.radius,
              padding: "16px 20px",
              fontSize: block.fontSize,
              lineHeight: block.lineHeight,
              textAlign: block.align,
              whiteSpace: "pre-wrap",
              overflowWrap: "break-word",
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
              lineHeight: 2,
            }}
          >
            {items.map((item, index) => (
              <span key={index} style={{ display: "inline-flex", alignItems: "center" }}>
                {index > 0 && (
                  <span style={{ color: ink.text(MENU_DOT, doc.contentBackground), padding: "0 8px" }}>·</span>
                )}
                <span
                  style={{
                    color: empty ? ink.text(PLACEHOLDER_INK, doc.contentBackground) : ink.text(block.color, doc.contentBackground),
                    whiteSpace: "nowrap",
                  }}
                >
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
                    backgroundColor: ink.fill(badge.bg),
                    color: ink.text("#ffffff", badge.bg),
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
      // The exporter's geometry: the block is inset by its spacing less half a
      // column gap, each column is `colMax` wide and its content half a gap in, so
      // the outer columns' content lines up with every other block. Columns sit side
      // by side where they fit and stack full-width where they don't — exactly what
      // the email does on a phone.
      const colMax = columnWidth(block, doc)
      const kids = block.children.map(inColumn)
      const fit = (child: Block): Block =>
        child.type === "image"
          ? { ...child, width: Math.min(child.width, Math.max(40, colMax - blockSpacing(child, doc).x * 2)) }
          : child
      return (
        <div style={{ padding: `${y}px ${columnsInset(block, doc)}px`, fontFamily }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "center" }}>
            {kids.map((child) => (
              <div key={child.id} style={{ flex: `1 1 ${colMax}px`, maxWidth: "100%", minWidth: 0 }}>
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
            <div
              className="flex w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed py-10 text-center"
              style={{
                backgroundColor: ink.fill("#fafafa"),
                borderColor: ink.fill("#d4d4d4"),
                color: ink.text("#a3a3a3", "#fafafa"),
              }}
            >
              <ImageOff className="size-5" />
              <span className="text-xs">Add an image URL in the panel</span>
            </div>
          )}
        </div>
      )
  }
})
