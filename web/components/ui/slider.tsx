"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Slider({
  className,
  value,
  defaultValue,
  min = 0,
  max = 100,
  showTooltip = true,
  formatTooltip,
  onValueChange,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  showTooltip?: boolean
  formatTooltip?: (value: number) => React.ReactNode
}) {
  const isControlled = value !== undefined
  const resolvedDefault = (defaultValue ?? [min]) as number[]
  const [internal, setInternal] = React.useState<number[]>(resolvedDefault)
  const values = isControlled ? (value as number[]) : internal
  const valuesKey = values.join(",")

  const rootRef = React.useRef<HTMLSpanElement>(null)
  const [hovering, setHovering] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const [positions, setPositions] = React.useState<{ x: number; y: number }[]>([])
  const visible = showTooltip && (hovering || dragging || focused)

  const measure = React.useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const thumbs = root.querySelectorAll<HTMLElement>('[data-slot="slider-thumb"]')
    setPositions(
      Array.from(thumbs, (t) => {
        const r = t.getBoundingClientRect()
        return { x: r.left + r.width / 2, y: r.top }
      }),
    )
  }, [])

  React.useEffect(() => {
    if (!visible) return
    measure()
    const onMove = () => measure()
    window.addEventListener("scroll", onMove, true)
    window.addEventListener("resize", onMove)
    return () => {
      window.removeEventListener("scroll", onMove, true)
      window.removeEventListener("resize", onMove)
    }
  }, [visible, valuesKey, measure])

  React.useEffect(() => {
    if (!dragging) return
    const end = () => setDragging(false)
    window.addEventListener("pointerup", end)
    window.addEventListener("pointercancel", end)
    return () => {
      window.removeEventListener("pointerup", end)
      window.removeEventListener("pointercancel", end)
    }
  }, [dragging])

  return (
    <SliderPrimitive.Root
      ref={rootRef}
      data-slot="slider"
      value={value}
      defaultValue={isControlled ? undefined : resolvedDefault}
      min={min}
      max={max}
      onValueChange={(v) => {
        if (!isControlled) setInternal(v)
        onValueChange?.(v)
      }}
      onPointerDown={(e) => {
        setDragging(true)
        measure()
        onPointerDown?.(e)
      }}
      onPointerEnter={(e) => {
        setHovering(true)
        measure()
        onPointerEnter?.(e)
      }}
      onPointerLeave={(e) => {
        setHovering(false)
        onPointerLeave?.(e)
      }}
      onFocus={(e) => {
        setFocused(true)
        measure()
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setFocused(false)
        onBlur?.(e)
      }}
      className={cn(
        "group/slider relative flex w-full touch-none items-center select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative grow overflow-hidden rounded-full bg-muted data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:w-full data-[orientation=horizontal]:cursor-ew-resize data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2 data-[orientation=vertical]:cursor-ns-resize">
        <SliderPrimitive.Range className="absolute rounded-full bg-primary data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full" />
      </SliderPrimitive.Track>
      {values.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          data-slot="slider-thumb"
          className={cn(
            "block size-5 shrink-0 cursor-ew-resize rounded-full border-2 border-background bg-primary ring-primary/50 transition-transform duration-150 outline-none focus-visible:ring-3 active:scale-125",
            dragging && values.length === 1 && "scale-125",
          )}
        />
      ))}
      {visible &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            {values.map((v, i) =>
              positions[i] ? (
                <div
                  key={i}
                  aria-hidden
                  className={cn(
                    "pointer-events-none fixed z-50 origin-bottom -translate-x-1/2 -translate-y-full rounded-md bg-foreground px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-background shadow-sm transition-transform duration-150",
                    dragging && "scale-110",
                  )}
                  style={{ left: positions[i].x, top: positions[i].y - 8 }}
                >
                  {formatTooltip ? formatTooltip(v) : v}
                </div>
              ) : null,
            )}
          </>,
          document.body,
        )}
    </SliderPrimitive.Root>
  )
}

export { Slider }
