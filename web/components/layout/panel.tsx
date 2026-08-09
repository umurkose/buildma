"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { usePathname, useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

const DEFAULT_WIDTH = 416

export function Panel({
  open = true,
  title,
  closeHref,
  children,
}: {
  open?: boolean
  title?: React.ReactNode
  closeHref?: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const [slot] = useState<HTMLElement | null>(() =>
    typeof document === "undefined" ? null : document.getElementById("panel-slot"),
  )
  const [mounted, setMounted] = useState(open)
  const [entered, setEntered] = useState(false)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [resizing, setResizing] = useState(false)

  const startResize = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = width
      setResizing(true)
      const max = Math.min(800, window.innerWidth * 0.7)
      const move = (ev: PointerEvent) =>
        setWidth(
          Math.round(Math.min(Math.max(startWidth + (startX - ev.clientX), DEFAULT_WIDTH), max)),
        )
      const up = () => {
        setResizing(false)
        window.removeEventListener("pointermove", move)
        window.removeEventListener("pointerup", up)
      }
      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", up)
    },
    [width],
  )

  const last = useRef({ title, children })
  const [lastVisible, setLastVisible] = useState({ title, children })

  useLayoutEffect(() => {
    if (open) {
      last.current = { title, children }
      const frame = window.requestAnimationFrame(() => setLastVisible({ title, children }))
      return () => window.cancelAnimationFrame(frame)
    }
  }, [open, title, children])

  useLayoutEffect(() => {
    if (open) {
      const frame = window.requestAnimationFrame(() => setMounted(true))
      return () => window.cancelAnimationFrame(frame)
    }
  }, [open])

  useLayoutEffect(() => {
    if (!slot || !mounted) return
    const frame = window.requestAnimationFrame(() => setEntered(true))
    return () => window.cancelAnimationFrame(frame)
  }, [slot, mounted])

  const close = useCallback(() => {
    if (closeHref) router.push(closeHref, { scroll: false })
    else router.back()
  }, [router, closeHref])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, close])

  if (!slot || !mounted) return null

  const shown = open ? { title, children } : lastVisible

  return createPortal(
    <aside
      data-motion
      data-state={open && entered ? "open" : "closed"}
      style={{ "--panel-w": `${width}px` } as React.CSSProperties}
      onTransitionEnd={(e) => {
        if (!open && e.target === e.currentTarget && e.propertyName === "opacity") {
          setMounted(false)
          setEntered(false)
        }
      }}
      className={cn(
        "absolute inset-0 z-40 flex flex-col bg-background transition-[opacity,width] duration-300 ease-drawer data-[state=closed]:pointer-events-none data-[state=closed]:opacity-0 sm:relative sm:inset-auto sm:z-auto sm:w-(--panel-w) sm:shrink-0 sm:overflow-hidden sm:border-l sm:border-border sm:data-[state=closed]:w-0 sm:data-[state=closed]:border-l-0",
        resizing && "transition-none",
      )}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        onPointerDown={startResize}
        onDoubleClick={() => setWidth(DEFAULT_WIDTH)}
        className="absolute inset-y-0 left-0 z-10 hidden w-2 cursor-col-resize touch-none after:absolute after:inset-y-0 after:left-0 after:w-px hover:after:bg-sidebar-border active:after:bg-sidebar-border sm:block"
      />
      <div className="flex min-h-0 w-full flex-1 flex-col sm:w-(--panel-w)">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
          <Button variant="ghost" size="icon-sm" className="-ml-1" onClick={close}>
            <X />
            <span className="sr-only">Close</span>
          </Button>
          <span className="truncate text-sm font-medium">{shown.title}</span>
          <span className="ml-auto hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Kbd>Esc</Kbd>
            to close
          </span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{shown.children}</div>
      </div>
    </aside>,
    slot,
  )
}

export function DetailSlot({
  basePath,
  title,
  children,
}: {
  basePath: string
  title?: React.ReactNode
  children: React.ReactNode
}) {
  const open = usePathname().startsWith(`${basePath}/`)
  return (
    <Panel open={open} title={title} closeHref={basePath}>
      {children}
    </Panel>
  )
}
