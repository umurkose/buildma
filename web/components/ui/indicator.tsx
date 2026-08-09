"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

const SETTLE = 200
const EASE = "cubic-bezier(0.23, 1, 0.32, 1)"
const FILL = "[data-indicator-fill]"

export type IndicatorOptions = {
  active: string
  item?: string
  axis?: "x" | "y"
  enabled?: boolean
}

export function IndicatorFill({
  layout,
  children,
}: {
  layout?: string
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <span
        aria-hidden
        data-indicator-fill
        style={{ clipPath: "inset(0 100% 0 0)" }}
        className={cn(
          "pointer-events-none absolute inset-0 text-primary-foreground [&_svg]:text-current!",
          layout,
        )}
      >
        {children}
      </span>
    </>
  )
}

export function useIndicator<T extends HTMLElement>({
  active,
  item,
  axis = "x",
  enabled = true,
}: IndicatorOptions) {
  const ref = React.useRef<T>(null)
  const [style, setStyle] = React.useState<React.CSSProperties>({ opacity: 0 })
  const first = React.useRef(true)
  const last = React.useRef("")
  const horizontal = axis === "x"

  const paint = React.useCallback(
    (start: number, size: number, animate: boolean) => {
      const host = ref.current
      if (!host || !item) return
      const hostRect = host.getBoundingClientRect()
      const end = start + size

      const work: [HTMLElement, number, number][] = []
      for (const el of host.querySelectorAll<HTMLElement>(item)) {
        const fill = el.querySelector<HTMLElement>(FILL)
        if (!fill) continue
        const r = el.getBoundingClientRect()
        const a = horizontal ? r.left - hostRect.left : r.top - hostRect.top
        const len = horizontal ? r.width : r.height
        work.push([
          fill,
          Math.min(Math.max(start - a, 0), len),
          Math.min(Math.max(a + len - end, 0), len),
        ])
      }

      const transition = animate ? `clip-path ${SETTLE}ms ${EASE}` : "none"
      for (const [fill, before, after] of work) {
        fill.style.transition = transition
        fill.style.clipPath = horizontal
          ? `inset(0 ${after}px 0 ${before}px)`
          : `inset(${before}px 0 ${after}px 0)`
      }
    },
    [item, horizontal],
  )

  const locate = React.useCallback(() => {
    const host = ref.current
    const el = host?.querySelector<HTMLElement>(active)
    if (!host || !el) return null
    const hostRect = host.getBoundingClientRect()
    const cs = getComputedStyle(host)
    const r = el.getBoundingClientRect()
    return {
      x: r.left - hostRect.left - (parseFloat(cs.borderLeftWidth) || 0),
      y: r.top - hostRect.top - (parseFloat(cs.borderTopWidth) || 0),
      width: r.width,
      height: r.height,
    }
  }, [active])

  useIsoLayoutEffect(() => {
    const host = ref.current
    if (!enabled || !host) return

    const measure = (animate: boolean) => {
      const at = locate()
      if (!at) {
        last.current = ""
        setStyle((s) => (s.opacity === 0 ? s : { ...s, opacity: 0 }))
        return
      }
      const key = `${at.x},${at.y},${at.width},${at.height}`
      if (key === last.current && !first.current) return
      last.current = key

      const slide = animate && !first.current
      setStyle({
        opacity: 1,
        width: at.width,
        height: at.height,
        transform: `translate(${at.x}px, ${at.y}px)`,
        transition: slide ? undefined : "none",
      })
      paint(horizontal ? at.x : at.y, horizontal ? at.width : at.height, slide)
      first.current = false
    }

    measure(false)

    const mo = new MutationObserver(() => measure(true))
    mo.observe(host, {
      attributes: true,
      attributeFilter: ["data-state", "data-active", "aria-current"],
      childList: true,
      subtree: true,
    })
    const ro = new ResizeObserver(() => measure(false))
    ro.observe(host)

    const onViewport = () => measure(false)
    window.addEventListener("resize", onViewport)

    const rootMo = new MutationObserver(onViewport)
    rootMo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    })

    document.fonts?.ready.then(() => measure(false)).catch(() => {})

    const settle = () => measure(false)
    host.addEventListener("animationend", settle)
    host.addEventListener("transitionend", settle)
    const running = host.getAnimations?.({ subtree: true }) ?? []
    Promise.allSettled(running.map((a) => a.finished)).then(settle)

    return () => {
      mo.disconnect()
      ro.disconnect()
      rootMo.disconnect()
      window.removeEventListener("resize", onViewport)
      host.removeEventListener("animationend", settle)
      host.removeEventListener("transitionend", settle)
    }
  }, [active, enabled, locate, paint, horizontal])

  const pill = React.useCallback(
    (className?: string) => ({
      "aria-hidden": true,
      "data-slot": "indicator",
      style,
      className: cn(
        "absolute top-0 left-0 z-0 transition-[transform,width,height,box-shadow] duration-200 ease-out",
        "pointer-events-none",
        className,
      ),
    }),
    [style],
  )

  return { ref, pill }
}
