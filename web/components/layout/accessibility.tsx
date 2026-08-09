"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { TextSizeSelect } from "@/components/theme/text-size"
import { PrimaryColorPicker } from "@/components/theme/color"
import { ThemeSelect } from "@/components/theme/toggle"

export const DOCK_BUTTON =
  "group size-12 rounded-full shadow-xs hover:border-primary! hover:bg-primary! hover:text-primary-foreground!"

const PANEL = { type: "spring", bounce: 0.2, duration: 0.35 } as const
const MORPH = { type: "spring", bounce: 0.25, duration: 0.35 } as const

function MenuGlyph({ open, reduce }: { open: boolean; reduce: boolean | null }) {
  const transition = reduce ? { duration: 0.12 } : MORPH
  const bar = "absolute h-[2px] w-[18px] rounded-full bg-current"
  return (
    <span aria-hidden className="relative flex size-5 items-center justify-center">
      <motion.span
        className={bar}
        initial={false}
        animate={{ rotate: open ? 45 : 0, y: open ? 0 : -3.5 }}
        transition={transition}
      />
      <motion.span
        className={bar}
        initial={false}
        animate={{ rotate: open ? -45 : 0, y: open ? 0 : 3.5 }}
        transition={transition}
      />
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

export function AccessibilityDock() {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

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

  const enter = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 10 }
  const shown = { opacity: 1, scale: 1, y: 0 }

  return (
    <div
      ref={root}
      className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-45 flex flex-col items-end gap-2.5 print:hidden"
    >
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-labelledby="a11y-dock-title"
            initial={enter}
            animate={shown}
            exit={enter}
            transition={reduce ? { duration: 0.15 } : PANEL}
            style={{ originX: 1, originY: 1 }}
            className="w-68 rounded-2xl border border-border bg-popover p-4 shadow-md"
          >
            <div className="flex flex-col gap-4">
              <span id="a11y-dock-title" className="text-sm font-semibold">
                Accessibility
              </span>
              <Field label="Text size">
                <TextSizeSelect className="w-full" />
              </Field>
              <Field label="Appearance">
                <ThemeSelect className="w-full" />
              </Field>
              <Field label="Accent colour">
                <PrimaryColorPicker className="w-full flex-nowrap justify-between gap-0" />
              </Field>
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
        aria-label={open ? "Close accessibility settings" : "Accessibility settings"}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          DOCK_BUTTON,
          "aria-expanded:border-primary aria-expanded:bg-primary aria-expanded:text-primary-foreground dark:aria-expanded:border-primary dark:aria-expanded:bg-primary",
        )}
      >
        <MenuGlyph open={open} reduce={reduce} />
      </Button>
    </div>
  )
}
