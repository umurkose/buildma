"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react"
import { createPortal } from "react-dom"
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react"

import { cn } from "@/lib/utils"
import { EMAIL_WIDTH, META, useBuilder, type BlockType } from "@/components/builder/store"

type PaletteDnd = {
  contentRef: RefObject<HTMLDivElement | null>
  active: BlockType | null
  dropY: number | null
  start: (type: BlockType, clientX: number, clientY: number) => void
}

const Ctx = createContext<PaletteDnd | null>(null)

export function usePaletteDnd(): PaletteDnd {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("usePaletteDnd must be used within <PaletteDndProvider>")
  return ctx
}

const HIT_PAD = 8
export const DROP_INSET = 7

export function PaletteDndProvider({ children }: { children: ReactNode }) {
  const insert = useBuilder((state) => state.insert)

  const contentRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<BlockType | null>(null)
  const [over, setOver] = useState(false)
  const [dropY, setDropY] = useState<number | null>(null)

  const ox = useMotionValue(0)
  const oy = useMotionValue(0)
  const contentCX = useMotionValue(0)
  const contentW = useMotionValue(EMAIL_WIDTH)
  const over01 = useMotionValue(0)
  const x = useTransform(
    [ox, contentCX, over01],
    ([cx, ccx, p]: number[]) => cx + (ccx - cx) * p,
  )

  const reduce = useReducedMotion()
  useEffect(() => {
    const controls = animate(
      over01,
      over ? 1 : 0,
      reduce ? { duration: 0 } : { type: "spring", bounce: 0.15, duration: 0.35 },
    )
    return () => controls.stop()
  }, [over, over01, reduce])
  const pending = useRef<{ type: BlockType; index: number | null }>({ type: "text", index: null })
  const entered = useRef(false)

  const start = (type: BlockType, clientX: number, clientY: number) => {
    setActive(type)
    pending.current = { type, index: null }
    entered.current = false
    ox.set(clientX)
    oy.set(clientY)
    over01.set(0)

    const contentEl = contentRef.current
    if (contentEl) {
      const cr = contentEl.getBoundingClientRect()
      contentCX.set(cr.left + cr.width / 2)
      contentW.set(cr.width)
    }

    const onMove = (event: PointerEvent) => {
      const content = contentRef.current
      if (!content) {
        ox.set(event.clientX)
        oy.set(event.clientY)
        return
      }
      const cr = content.getBoundingClientRect()
      const inside =
        event.clientX >= cr.left - HIT_PAD &&
        event.clientX <= cr.right + HIT_PAD &&
        event.clientY >= cr.top - HIT_PAD &&
        event.clientY <= cr.bottom + HIT_PAD

      if (inside) entered.current = true
      if (entered.current) {
        ox.set(Math.min(cr.right + HIT_PAD, Math.max(cr.left - HIT_PAD, event.clientX)))
        oy.set(Math.min(cr.bottom + HIT_PAD, Math.max(cr.top - HIT_PAD, event.clientY)))
      } else {
        ox.set(event.clientX)
        oy.set(event.clientY)
      }

      if (!inside) {
        // Released, so the ghost re-attaches to the pointer the moment you leave.
        // Latched, the clamp stayed on for the rest of the drag: drag back out over
        // the palette to abandon the drop and the ghost stopped dead on the canvas
        // edge while the cursor kept going — no longer glued to the pointer, and
        // still looking like a live drop that release would not perform.
        entered.current = false
        setOver(false)
        setDropY(null)
        pending.current.index = null
        return
      }

      const rows = Array.from(content.querySelectorAll<HTMLElement>("[data-block-row]"))
      let index = rows.length
      let lineY = DROP_INSET
      for (let i = 0; i < rows.length; i++) {
        const rr = rows[i].getBoundingClientRect()
        if (event.clientY < rr.top + rr.height / 2) {
          index = i
          lineY = rr.top - cr.top + DROP_INSET
          break
        }
      }
      if (index === rows.length && rows.length > 0) {
        lineY = rows[rows.length - 1].getBoundingClientRect().bottom - cr.top - DROP_INSET
      }

      setOver(true)
      setDropY(lineY)
      pending.current.index = index
    }

    // `drop` false is the cancel path. Without it an interrupted pointer never fired
    // pointerup, so the listeners stayed bound, the ghost stayed on screen following
    // a cursor with nothing pressed, and the next click anywhere inserted a block at
    // whatever gap it happened to be over. Reachable on any touch device: the palette
    // scrolls, and a vertical drag out of it is claimed by the scroll container.
    const finish = (drop: boolean) => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onCancel)
      const { type: t, index } = pending.current
      if (drop && index !== null) insert(t, index)
      setActive(null)
      setOver(false)
      setDropY(null)
    }
    const onUp = () => finish(true)
    const onCancel = () => finish(false)

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onCancel)
  }

  const meta = active ? META[active] : null
  const Icon = meta?.icon

  return (
    <Ctx.Provider value={{ contentRef, active, dropY, start }}>
      {children}

      {active && meta && Icon && typeof document !== "undefined"
        ? createPortal(
            <motion.div
              aria-hidden
              className="pointer-events-none fixed top-0 left-0 z-[100]"
              style={{ x, y: oy }}
            >
              <motion.div
                className={cn(
                  "flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-primary-foreground",
                  over ? "flex-row gap-2 bg-primary/70 px-4 backdrop-blur-sm" : "flex-col gap-1.5 bg-primary",
                )}
                animate={
                  over
                    ? { width: contentW.get(), height: 44, borderRadius: 12 }
                    : { width: 72, height: 72, borderRadius: 16 }
                }
                transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0.15, duration: 0.35 }}
              >
                <Icon className="size-5 shrink-0" />
                <span className="text-xs font-medium whitespace-nowrap">{meta.label}</span>
              </motion.div>
            </motion.div>,
            document.body,
          )
        : null}
    </Ctx.Provider>
  )
}
