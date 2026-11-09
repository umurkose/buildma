"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useTheme } from "next-themes"
import { Monitor, Moon, SlidersHorizontal, Sun, X, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PrimaryColorPicker } from "@/components/theme/color"
import { TEXT_SIZE_LABELS, TEXT_SIZES, useTextSize, type TextSize } from "@/components/theme/text-size"

// The floating display-settings button, bottom right on every page. It is a solid
// disc — not an outline — so it stays visible over anything: the landing page, the
// editor's coloured canvas, a dark dashboard.
export const DOCK_BUTTON =
  "group size-12 rounded-full border-transparent bg-foreground text-background shadow-lg shadow-black/15 hover:bg-foreground/90 hover:text-background dark:border-transparent dark:bg-foreground dark:hover:bg-foreground/90"

const PANEL = { type: "spring", bounce: 0.2, duration: 0.35 } as const

const THEMES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
]

// How big the "A" on each text-size option is drawn.
const GLYPH: Record<TextSize, string> = {
  "text-base": "text-sm",
  "text-lg": "text-base",
  "text-xl": "text-lg",
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

/** A row of equal choices; the active one is outlined in the accent. */
function Choices({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2">
      {children}
    </div>
  )
}

function Choice({
  active,
  disabled,
  onSelect,
  children,
}: {
  active: boolean
  disabled?: boolean
  onSelect: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex h-16 flex-col items-center justify-center gap-1 rounded-xl border text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

export function AccessibilityDock() {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])
  const textSize = useTextSize()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setOpen(false)
      trigger.current?.focus()
    }
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPointer, true)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointer, true)
    }
  }, [open])

  const enter = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 8 }
  const shown = { opacity: 1, scale: 1, y: 0 }
  const current = mounted ? (theme ?? "system") : null

  return (
    <div
      ref={root}
      className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-45 flex flex-col items-end gap-3 print:hidden"
    >
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-labelledby="display-settings-title"
            initial={enter}
            animate={shown}
            exit={enter}
            transition={reduce ? { duration: 0.15 } : PANEL}
            style={{ originX: 1, originY: 1 }}
            className="w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl shadow-black/10"
          >
            <div className="flex items-center gap-3 border-b border-border py-3 pr-2 pl-4">
              <div className="min-w-0 flex-1">
                <p id="display-settings-title" className="text-sm font-semibold">
                  Display
                </p>
                <p className="truncate text-xs text-muted-foreground">Theme, text size and accent</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close display settings"
                onClick={() => {
                  setOpen(false)
                  trigger.current?.focus()
                }}
              >
                <X />
              </Button>
            </div>

            <div className="flex flex-col gap-5 p-4">
              <Group label="Appearance">
                <Choices label="Appearance">
                  {THEMES.map(({ value, label, icon: Icon }) => (
                    <Choice
                      key={value}
                      active={current === value}
                      disabled={!mounted}
                      onSelect={() => setTheme(value)}
                    >
                      <Icon className="size-4.5" />
                      {label}
                    </Choice>
                  ))}
                </Choices>
              </Group>

              <Group label="Text size">
                <Choices label="Text size">
                  {TEXT_SIZES.map((size) => (
                    <Choice
                      key={size}
                      active={textSize.size === size}
                      disabled={!textSize.ready}
                      onSelect={() => textSize.setSize(size)}
                    >
                      <span aria-hidden className={cn("leading-none font-semibold", GLYPH[size])}>
                        A
                      </span>
                      {TEXT_SIZE_LABELS[size]}
                    </Choice>
                  ))}
                </Choices>
              </Group>

              <Group label="Accent colour">
                <PrimaryColorPicker className="w-full flex-nowrap justify-between gap-0" />
              </Group>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        ref={trigger}
        variant="outline"
        size="icon-lg"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={open ? "Close display settings" : "Display settings"}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          DOCK_BUTTON,
          "relative aria-expanded:bg-foreground aria-expanded:text-background dark:aria-expanded:bg-foreground",
        )}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={open ? "close" : "open"}
            initial={reduce ? { opacity: 0 } : { opacity: 0, rotate: -45, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, rotate: 45, scale: 0.6 }}
            transition={{ duration: 0.18 }}
            className="flex"
          >
            {open ? <X className="size-5" /> : <SlidersHorizontal className="size-5" />}
          </motion.span>
        </AnimatePresence>
      </Button>
    </div>
  )
}
