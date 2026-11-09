"use client"

import { useRef, useState } from "react"
import { Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { usePaletteDnd } from "@/components/builder/palette-dnd"
import { META, PALETTE_GROUPS, useBuilder, type BlockType } from "@/components/builder/store"

/**
 * The block palette: a search box over the editor's groups, each block a compact
 * tile — its icon and name. Click adds to the end; drag places it.
 *
 * `compact` is the small-screen version inside a sheet: tap only — no drag, so the
 * list scrolls under a finger — and `onPick` lets the sheet close after an add.
 */
export function PaletteContent({
  compact = false,
  onPick,
}: {
  compact?: boolean
  onPick?: () => void
}) {
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const groups = PALETTE_GROUPS.map((group) => ({
    ...group,
    types: group.types.filter(
      (type) =>
        !q || META[type].label.toLowerCase().includes(q) || META[type].desc.toLowerCase().includes(q),
    ),
  })).filter((group) => group.types.length > 0)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* In a sheet, the sheet's own close button sits at the right end of this row. */}
      <div className={cn("flex h-12 shrink-0 items-center border-b border-border px-3", compact && "pr-12")}>
        <div className="relative w-full">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setQuery("")
            }}
            placeholder="Search blocks"
            aria-label="Search blocks"
            className="h-8 w-full rounded-lg border border-input bg-transparent pr-8 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {groups.length === 0 ? (
          <p className="px-2 py-10 text-center text-sm text-muted-foreground">
            No block matches “{query.trim()}”.
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="not-first:mt-5">
              <h3 className="mb-2 px-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase select-none">
                {group.label}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {group.types.map((type) => (
                  <PaletteTile key={type} type={type} compact={compact} onPick={onPick} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <p className="shrink-0 border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground select-none">
        {compact ? "Tap a block to add it to the end." : "Click to add · Drag onto the canvas to place."}
      </p>
    </div>
  )
}

function PaletteTile({
  type,
  compact,
  onPick,
}: {
  type: BlockType
  compact: boolean
  onPick?: () => void
}) {
  const add = useBuilder((state) => state.add)
  const { start, active } = usePaletteDnd()
  const dragging = useRef(false)
  const { label, desc, icon: Icon } = META[type]
  const dragActive = active === type

  return (
    <button
      type="button"
      title={`${label} — ${desc}`}
      onPointerDown={
        compact
          ? undefined
          : (event) => {
              dragging.current = false
              const startX = event.clientX
              const startY = event.clientY
              const { pointerId } = event
              const controller = new AbortController()
              // window, not the button. A mouse pointer gets no implicit capture (the
              // spec grants that to touch and pen only), so pointermove goes to
              // whatever is under the cursor — and one 60Hz frame of a normal flick
              // covers more than a tile. Bound to the button, a quick drag delivered
              // neither move nor up: the gesture died silently AND the listener
              // outlived it, so later merely hovering began a drag with no button held.
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
            }
      }
      onClick={() => {
        if (dragging.current) return
        add(type)
        onPick?.()
      }}
      // A quiet grey tile: the icon and its name, nothing boxed or coloured. While
      // its block is being dragged the tile is left as a dashed outline — the block
      // has been lifted out of it.
      className={cn(
        "group flex h-[4.5rem] w-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border px-1 text-center outline-none select-none",
        "transition-[background-color,border-color,color,scale] duration-150 ease-out",
        !compact && "touch-none",
        dragActive
          ? "border-dashed border-foreground/25 bg-transparent text-muted-foreground"
          : "border-transparent bg-muted/60 text-foreground/75 hover:bg-muted hover:text-foreground dark:bg-muted/50 dark:hover:bg-muted",
        "active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring/50",
      )}
    >
      <Icon className="size-5 shrink-0" strokeWidth={1.75} />
      <span
        className={cn(
          "w-full truncate px-0.5 text-[11px] leading-4 font-medium transition-colors duration-150",
          dragActive ? "text-muted-foreground" : "text-muted-foreground group-hover:text-foreground",
        )}
      >
        {label}
      </span>
    </button>
  )
}
