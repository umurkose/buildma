"use client"

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react"
import {
  Check,
  ChevronDown,
  Download,
  GripVertical,
  Heading,
  Image as ImageIcon,
  Minus,
  MousePointer2,
  MousePointerClick,
  Type,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { STEPS } from "@/components/landing/content"
import { SectionHeader } from "@/components/landing/section"
import { useScrollContainer } from "@/components/landing/scroll"

// --- Timeline helpers -------------------------------------------------------

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const phase = (p: number, from: number, to: number) => clamp01((p - from) / (to - from))
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const bez = (t: number, p0: number, c: number, p1: number) => {
  const m = 1 - t
  return m * m * p0 + 2 * m * t * c + t * t * p1
}

// --- Stage geometry ---------------------------------------------------------

type Rect = { x: number; y: number; w: number; h: number }
type Anchors = Record<string, Rect>

function useAnchors(stage: RefObject<HTMLElement | null>): Anchors {
  const [rects, setRects] = useState<Anchors>({})

  useEffect(() => {
    const node = stage.current
    if (!node) return

    const measure = () => {
      const next: Anchors = {}
      node.querySelectorAll<HTMLElement>("[data-anchor]").forEach((el) => {
        const name = el.dataset.anchor
        if (!name) return
        let x = 0
        let y = 0
        for (let n: HTMLElement | null = el; n && n !== node; n = n.offsetParent as HTMLElement | null) {
          x += n.offsetLeft
          y += n.offsetTop
        }
        next[name] = { x, y, w: el.offsetWidth, h: el.offsetHeight }
      })
      setRects(next)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    node.querySelectorAll<HTMLElement>("[data-anchor]").forEach((el) => observer.observe(el))
    document.fonts.ready.then(measure).catch(() => {})
    return () => observer.disconnect()
  }, [stage])

  return rects
}

const cx = (r?: Rect) => (r ? r.x + r.w / 2 : 0)
const cy = (r?: Rect) => (r ? r.y + r.h / 2 : 0)

// --- Shared furniture -------------------------------------------------------

function Arrive({
  p,
  from,
  to,
  className,
  children,
}: {
  p: MotionValue<number>
  from: number
  to: number
  className?: string
  children: ReactNode
}) {
  const opacity = useTransform(p, (v) => phase(v, from, to))
  const y = useTransform(p, (v) => mix(14, 0, ease(phase(v, from, to))))
  return (
    <motion.div style={{ opacity, y }} className={className}>
      {children}
    </motion.div>
  )
}

function Scene({ children }: { children: (progress: MotionValue<number>) => ReactNode }) {
  const reduce = useReducedMotion()
  const container = useScrollContainer()
  const runway = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: runway,
    container,
    offset: ["start 0.5", "end end"],
  })

  const smooth = useSpring(scrollYProgress, { bounce: 0, visualDuration: 0.35 })

  const [short, setShort] = useState(false)
  useEffect(() => {
    const query = window.matchMedia(
      "(max-width: 1023px) and (max-height: 700px), (min-width: 1024px) and (max-height: 460px)",
    )
    const sync = () => setShort(query.matches)
    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])
  const still = reduce || short

  const settled = useMotionValue(0)
  useEffect(() => {
    if (still) settled.jump(1)
  }, [still, settled])
  const progress = still ? settled : smooth

  return (
    <div
      ref={runway}
      className="relative h-[190vh] motion-reduce:h-auto! [@media(max-width:1023px)_and_(max-height:700px)]:h-auto! [@media(min-width:1024px)_and_(max-height:460px)]:h-auto! lg:h-[240vh]"
    >
      <div className="sticky top-0 flex h-svh items-center overflow-x-clip motion-reduce:static! motion-reduce:h-auto! motion-reduce:py-16 [@media(max-width:1023px)_and_(max-height:700px)]:static! [@media(max-width:1023px)_and_(max-height:700px)]:h-auto! [@media(max-width:1023px)_and_(max-height:700px)]:py-16 [@media(min-width:1024px)_and_(max-height:460px)]:static! [@media(min-width:1024px)_and_(max-height:460px)]:h-auto! [@media(min-width:1024px)_and_(max-height:460px)]:py-16">
        <div className="mx-auto w-full max-w-5xl px-5">{children(progress)}</div>
      </div>
    </div>
  )
}

function Line({
  progress,
  from,
  to,
  className,
  as = "p",
  children,
}: {
  progress: MotionValue<number>
  from: number
  to: number
  className?: string
  as?: "span" | "h3" | "p"
  children: ReactNode
}) {
  const t = useTransform(progress, (p) => phase(p, from, to))
  const y = useTransform(t, [0, 1], [12, 0])
  const Tag = as === "h3" ? motion.h3 : as === "span" ? motion.span : motion.p
  return (
    <Tag style={{ opacity: t, y }} className={className}>
      {children}
    </Tag>
  )
}

function Copyblock({
  step,
  progress,
  flip,
  from = 0.56,
  className,
}: {
  step: (typeof STEPS)[number]
  progress: MotionValue<number>
  flip?: boolean
  from?: number
  className?: string
}) {
  return (
    <div
      className={cn("order-2 flex flex-col", flip ? "lg:order-2" : "lg:order-1", className)}
    >
      <Line
        as="span"
        progress={progress}
        from={from}
        to={from + 0.09}
        className="text-sm font-medium text-primary"
      >
        {step.label}
      </Line>
      <Line
        as="h3"
        progress={progress}
        from={from + 0.07}
        to={from + 0.19}
        className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
      >
        {step.title}
      </Line>
      <Line
        progress={progress}
        from={from + 0.16}
        to={from + 0.3}
        className="mt-4 text-base text-muted-foreground text-pretty sm:text-lg"
      >
        {step.body}
      </Line>
    </div>
  )
}

function Split({
  innerRef,
  children,
  className,
}: {
  innerRef?: RefObject<HTMLDivElement | null>
  children: ReactNode
  className?: string
}) {
  return (
    <div
      ref={innerRef}
      className={cn("relative grid items-center gap-10 lg:grid-cols-2 lg:gap-14", className)}
    >
      {children}
    </div>
  )
}

function Canvas({
  children,
  highlight,
  enter,
  flip,
  className,
}: {
  children: ReactNode
  highlight?: MotionValue<number>
  enter?: MotionValue<number>
  flip?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative order-1 flex h-72 items-center justify-center rounded-2xl px-6 sm:h-88 sm:px-10 lg:h-104 lg:px-10",
        flip ? "lg:order-1" : "lg:order-2",
        className,
      )}
    >
      <motion.div
        aria-hidden
        style={enter ? { opacity: enter } : undefined}
        className="absolute inset-0 rounded-2xl border border-dashed border-border bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[16px_16px]"
      />
      {highlight && (
        <motion.div
          aria-hidden
          style={{ opacity: highlight }}
          className="absolute inset-0 rounded-2xl border border-dashed border-primary/60 bg-primary/5"
        />
      )}
      <div className="relative w-full">{children}</div>
    </div>
  )
}

function Cursor({
  x,
  y,
  opacity,
  pressed,
}: {
  x: MotionValue<number>
  y: MotionValue<number>
  opacity: MotionValue<number>
  pressed: MotionValue<number>
}) {
  const scale = useTransform(pressed, [0, 1], [1, 0.88])
  const ringScale = useTransform(pressed, [0, 1], [0.4, 1])
  return (
    <motion.div
      aria-hidden
      style={{ x, y, opacity, scale }}
      className="pointer-events-none absolute top-0 left-0 z-40"
    >
      <MousePointer2 className="size-6 fill-foreground text-background" strokeWidth={1.5} />
      <motion.span
        style={{ opacity: pressed, scale: ringScale }}
        className="absolute top-0 left-0 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-primary/50"
      />
    </motion.div>
  )
}

function BlockCard({
  label,
  icon: Icon,
  className,
}: {
  label: string
  icon: LucideIcon
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5",
        className,
      )}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <span className="flex-1 truncate text-xs font-semibold">{label}</span>
      <GripVertical className="size-3.5 shrink-0 text-muted-foreground/50" />
    </div>
  )
}

function Frame({
  show,
  measures,
  children,
}: {
  show: MotionValue<number>
  measures: { label: string; value: string }[]
  children: ReactNode
}) {
  return (
    <div className="relative w-full">
      {children}
      <motion.div
        aria-hidden
        style={{ opacity: show }}
        className="pointer-events-none absolute -inset-x-3 -inset-y-2.5"
      >
        <div className="absolute inset-0 rounded-[3px] border border-dashed border-primary" />
        {[
          "-top-[3px] -left-[3px]",
          "-top-[3px] -right-[3px]",
          "-bottom-[3px] -left-[3px]",
          "-bottom-[3px] -right-[3px]",
        ].map((corner) => (
          <span
            key={corner}
            className={cn("absolute size-1.5 rounded-[1px] border border-primary bg-background", corner)}
          />
        ))}

        <span className="absolute -top-5 left-0 rounded-sm bg-primary px-1.5 text-[10px] leading-4 font-medium text-primary-foreground">
          Heading
        </span>
        <span className="absolute -top-5 right-0 flex items-stretch overflow-hidden rounded-sm bg-primary text-[10px] leading-4 font-medium text-primary-foreground">
          {measures.map((row, i) => (
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
      </motion.div>
    </div>
  )
}

const CARD_W = "w-60"

const DROPPED = [
  { label: "W", value: "600" },
  { label: "H", value: "44" },
  { label: "Size", value: "22" },
  { label: "Gap", value: "12" },
]

const TRAY: { label: string; icon: LucideIcon }[] = [
  { label: "Heading", icon: Heading },
  { label: "Text", icon: Type },
  { label: "Image", icon: ImageIcon },
  { label: "Button", icon: MousePointerClick },
  { label: "Divider", icon: Minus },
]

const DEAL_STEP = 0.028
const DEAL_SPAN = 0.1
const GRAB_IN = 0.3
const GRAB_OUT = 0.36
const CARRY_IN = 0.36
const CARRY_OUT = 0.62

function TrayCard({
  p,
  index,
  label,
  icon,
  isSource,
}: {
  p: MotionValue<number>
  index: number
  label: string
  icon: LucideIcon
  isSource: boolean
}) {
  const deal = (v: number) => phase(v, 0.03 + index * DEAL_STEP, 0.03 + index * DEAL_STEP + DEAL_SPAN)

  const opacity = useTransform(p, (v) => {
    const arrived = deal(v)
    if (isSource) {
      return arrived * (1 - phase(v, GRAB_OUT, GRAB_OUT + 0.03))
    }
    const stepBack = mix(1, 0.3, phase(v, GRAB_IN, GRAB_OUT))
    const leave = 1 - phase(v, CARRY_IN + 0.02, CARRY_IN + 0.16)
    return arrived * stepBack * leave
  })

  const y = useTransform(p, (v) => mix(14, 0, ease(deal(v))))
  const scale = useTransform(p, (v) =>
    isSource
      ? mix(1, 0.96, phase(v, GRAB_IN, GRAB_OUT))
      : mix(1, 0.98, phase(v, GRAB_IN, GRAB_OUT)),
  )

  return (
    <motion.div
      aria-hidden
      data-anchor={isSource ? "source" : undefined}
      style={{ opacity, y, scale }}
    >
      <BlockCard label={label} icon={icon} />
    </motion.div>
  )
}

function DragScene({ p }: { p: MotionValue<number> }) {
  const stage = useRef<HTMLDivElement>(null)
  const anchors = useAnchors(stage)

  const carryX = (v: number) => {
    const t = ease(phase(v, CARRY_IN, CARRY_OUT))
    const from = cx(anchors.source)
    const to = cx(anchors.slot)
    return bez(t, from, mix(from, to, 0.92), to)
  }
  const carryY = (v: number) => {
    const t = ease(phase(v, CARRY_IN, CARRY_OUT))
    const from = cy(anchors.source)
    return bez(t, from, from - 16, cy(anchors.slot))
  }

  const surface = useTransform(p, (v) => phase(v, 0.06, 0.2))

  const grip = useTransform(p, (v) => phase(v, GRAB_IN, GRAB_OUT) * (1 - phase(v, CARRY_OUT, CARRY_OUT + 0.04)))
  const liftScale = useTransform(p, (v) => mix(1, 1.04, phase(v, GRAB_OUT - 0.02, CARRY_IN + 0.06)))
  const seam = useTransform(p, (v) => phase(v, 0.46, 0.55) * (1 - phase(v, 0.6, 0.65)))
  const lifted = useTransform(p, (v) => phase(v, GRAB_OUT, GRAB_OUT + 0.03) * (1 - phase(v, 0.6, 0.65)))
  const tilt = useTransform(p, (v) => -3 * phase(v, GRAB_OUT, CARRY_IN + 0.06) * (1 - phase(v, 0.6, 0.65)))

  const zone = useTransform(p, (v) => phase(v, 0.42, 0.54) * (1 - phase(v, 0.66, 0.76)))
  const drop = useTransform(p, (v) => phase(v, 0.6, 0.68))
  const dropScale = useTransform(p, (v) => mix(0.94, 1, phase(v, 0.6, 0.68)))
  const measured = useTransform(p, (v) => phase(v, 0.68, 0.78))
  const partY = useTransform(p, (v) => mix(-44, 0, ease(phase(v, 0.4, 0.56))))

  const cardX = useTransform(p, carryX)
  const cardY = useTransform(p, carryY)

  const cursorX = useTransform(p, (v) => {
    const home = cx(anchors.source)
    const leave = ease(phase(v, 0.66, 0.8))
    const base = v < CARRY_IN ? mix(-70, home, ease(phase(v, 0.16, GRAB_IN))) : carryX(v)
    return base + leave * 90
  })
  const cursorY = useTransform(p, (v) => {
    const home = cy(anchors.source)
    const leave = ease(phase(v, 0.66, 0.8))
    const below = (stage.current?.offsetHeight ?? 400) + 60
    const base = v < CARRY_IN ? mix(below, home, ease(phase(v, 0.16, GRAB_IN))) : carryY(v)
    return base - leave * 70
  })
  const cursorOpacity = useTransform(p, (v) => phase(v, 0.16, 0.24) * (1 - phase(v, 0.68, 0.82)))

  return (
    <Split innerRef={stage}>
      <div className="order-2 grid lg:order-1">
        <div className={cn("col-start-1 row-start-1 flex flex-col justify-center gap-2", CARD_W)}>
          {TRAY.map((block, i) => (
            <TrayCard
              key={block.label}
              p={p}
              index={i}
              label={block.label}
              icon={block.icon}
              isSource={i === 0}
            />
          ))}
        </div>
        <div className="col-start-1 row-start-1 flex flex-col justify-center">
          <Copyblock step={STEPS[0]} progress={p} from={0.68} className="!order-none" />
        </div>
      </div>

      <Canvas highlight={zone} enter={surface}>
        <motion.div
          style={{ opacity: surface }}
          className="relative mx-auto flex w-full max-w-[19rem] flex-col overflow-hidden rounded-xl border border-border bg-background p-5"
        >
          <div className="flex flex-col gap-2.5">
            <span className="h-1.5 w-full rounded-full bg-muted-foreground/20" />
            <span className="h-1.5 w-3/5 rounded-full bg-muted-foreground/20" />
          </div>

          <div className="relative mt-5 flex h-11 items-center">
            <motion.span
              aria-hidden
              style={{ opacity: seam }}
              className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1.5"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="h-0.5 flex-1 rounded-full bg-primary" />
            </motion.span>
            <Frame show={measured} measures={DROPPED}>
              <motion.div
                style={{ opacity: drop, scale: dropScale }}
                className="w-full origin-left"
              >
                <span
                  data-anchor="slot"
                  style={{ fontSize: 22 }}
                  className="inline-block leading-tight font-bold tracking-tight text-foreground"
                >
                  Launch day is here
                </span>
              </motion.div>
            </Frame>
          </div>

          <motion.div style={{ y: partY }} className="mt-5 flex flex-col gap-2.5">
            <span className="h-1.5 w-full rounded-full bg-muted-foreground/20" />
            <span className="h-1.5 w-4/5 rounded-full bg-muted-foreground/20" />
            <span className="h-1.5 w-2/5 rounded-full bg-muted-foreground/20" />
          </motion.div>
        </motion.div>
      </Canvas>

      <motion.div
        aria-hidden
        style={{ x: cardX, y: cardY, opacity: lifted, rotate: tilt, scale: liftScale }}
        className={cn(
          "pointer-events-none absolute top-0 left-0 z-30 -translate-x-1/2 -translate-y-1/2",
          CARD_W,
        )}
      >
        <BlockCard label="Heading" icon={Heading} className="border-primary/40 shadow-lg" />
      </motion.div>

      <Cursor x={cursorX} y={cursorY} opacity={cursorOpacity} pressed={grip} />
    </Split>
  )
}

const BRAND = ["#4f46e5", "#059669", "#e11d48"]
const INK_CLASS = "bg-neutral-900 dark:bg-neutral-500"
const PILL = 22

function Control({
  label,
  value,
  children,
}: {
  label: string
  value?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[11px] font-medium">
        <span className="text-muted-foreground">{label}</span>
        {value}
      </div>
      {children}
    </div>
  )
}

function StyleScene({ p }: { p: MotionValue<number> }) {
  const stage = useRef<HTMLDivElement>(null)
  const anchors = useAnchors(stage)

  const surface = useTransform(p, (v) => phase(v, 0.02, 0.1))

  const slide = (v: number) => ease(phase(v, 0.32, 0.46))
  const radius = useTransform(p, (v) => PILL * slide(v))
  const readout = useTransform(p, (v) => `${Math.round(slide(v) * 100)}%`)
  const at = (v: number) => `calc(0.5rem + (100% - 1rem) * ${slide(v)})`
  const fill = useTransform(p, (v) => at(v))
  const held = useTransform(p, (v) => phase(v, 0.28, 0.33) * (1 - phase(v, 0.46, 0.52)))
  const atRest = useTransform(p, (v) => 1 - phase(v, 0.28, 0.33) * (1 - phase(v, 0.46, 0.52)))
  const thumbScale = useTransform(p, (v) =>
    mix(1, 1.3, phase(v, 0.28, 0.33) * (1 - phase(v, 0.46, 0.5))),
  )

  const picked = useTransform(p, (v) => phase(v, 0.54, 0.58))
  const ringScale = useTransform(p, (v) => mix(1.5, 1, phase(v, 0.54, 0.58)))
  const brandFill = useTransform(p, (v) => phase(v, 0.54, 0.58))

  const widthAt = (v: number) => ease(phase(v, 0.65, 0.74))
  const fitLabel = useTransform(p, (v) => 1 - widthAt(v))
  const fullLabel = useTransform(p, widthAt)
  const buttonWidth = useTransform(p, (v) => {
    const fit = anchors.fit?.w ?? 0
    const row = anchors.row?.w ?? 0
    if (!fit || !row) return fit || undefined
    return mix(fit, row, widthAt(v))
  })

  const pressed = useTransform(p, (v) =>
    Math.max(
      phase(v, 0.28, 0.32) * (1 - phase(v, 0.46, 0.5)),
      phase(v, 0.53, 0.56) * (1 - phase(v, 0.6, 0.64)),
      phase(v, 0.64, 0.67) * (1 - phase(v, 0.71, 0.75)),
    ),
  )

  const thumbAt = (v: number) => {
    const track = anchors.track
    if (!track) return 0
    return track.x + 8 + (track.w - 16) * slide(v)
  }

  const cursorX = useTransform(p, (v) => {
    const swatch = cx(anchors.swatch)
    const width = cx(anchors.width)
    if (v < 0.28) return mix(-70, thumbAt(v), ease(phase(v, 0.16, 0.28)))
    if (v < 0.5) return thumbAt(v)
    if (v < 0.6) return mix(thumbAt(v), swatch, ease(phase(v, 0.5, 0.55)))
    return mix(swatch, width, ease(phase(v, 0.6, 0.65))) + ease(phase(v, 0.74, 0.86)) * 80
  })
  const cursorY = useTransform(p, (v) => {
    const trackY = cy(anchors.track)
    const swatchY = cy(anchors.swatch)
    const widthY = cy(anchors.width)
    const below = (stage.current?.offsetHeight ?? 400) + 60
    if (v < 0.28) return mix(below, trackY, ease(phase(v, 0.16, 0.28)))
    if (v < 0.5) return trackY
    if (v < 0.6) {
      const t = ease(phase(v, 0.5, 0.55))
      return bez(t, trackY, mix(trackY, swatchY, 0.5) - 26, swatchY)
    }
    const t = ease(phase(v, 0.6, 0.65))
    return bez(t, swatchY, mix(swatchY, widthY, 0.5) - 26, widthY) - ease(phase(v, 0.74, 0.86)) * 64
  })
  const cursorOpacity = useTransform(p, (v) => phase(v, 0.16, 0.24) * (1 - phase(v, 0.76, 0.88)))

  return (
    <Split innerRef={stage}>
      <Copyblock step={STEPS[1]} progress={p} flip from={0.7} />

      <Canvas flip enter={surface}>
        <div className="flex w-full flex-col gap-9">
          <Arrive p={p} from={0.06} to={0.16}>
            <div className="relative">
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-x-2.5 -inset-y-2.5 rounded-[3px] border border-dashed border-primary/60"
              />
              <span
                aria-hidden
                className="absolute -top-8 left-0 rounded bg-primary px-1.5 py-0.5 text-[11px] leading-4 font-semibold text-primary-foreground"
              >
                Button
              </span>
              <div data-anchor="row" className="flex w-full">
                <motion.span
                  style={{ borderRadius: radius, width: buttonWidth }}
                  className={cn(
                    "relative inline-flex h-11 items-center justify-center overflow-hidden px-7 text-sm font-semibold whitespace-nowrap text-white",
                    INK_CLASS,
                  )}
                >
                  <motion.span
                    aria-hidden
                    style={{ opacity: brandFill, backgroundColor: BRAND[0] }}
                    className="absolute inset-0"
                  />
                  <span className="relative">Read the update</span>
                </motion.span>
              </div>
              <span
                aria-hidden
                data-anchor="fit"
                className="pointer-events-none invisible absolute top-0 left-0 inline-flex h-11 items-center justify-center px-7 text-sm font-semibold whitespace-nowrap"
              >
                Read the update
              </span>
            </div>
          </Arrive>

          <div className="flex flex-col gap-5">
            <Arrive p={p} from={0.12} to={0.21}>
              <Control
                label="Radius"
                value={
                  <motion.span style={{ opacity: atRest }} className="tabular-nums text-foreground">
                    {readout}
                  </motion.span>
                }
              >
                <div data-anchor="track" className="relative h-1.5 w-full rounded-full bg-muted">
                  <motion.div
                    style={{ width: fill }}
                    className="absolute inset-y-0 left-0 rounded-full bg-primary/70"
                  />
                  <motion.span
                    aria-hidden
                    style={{ left: fill, opacity: held }}
                    className="absolute -top-8 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 text-[10px] leading-4 font-semibold tabular-nums text-background"
                  >
                    {readout}
                  </motion.span>
                  <motion.div
                    style={{ left: fill, scale: thumbScale }}
                    className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary"
                  />
                </div>
              </Control>
            </Arrive>

            <Arrive p={p} from={0.17} to={0.26}>
              <Control label="Colour">
                <div className="flex items-center gap-2.5">
                  {[...BRAND, null].map((colour, i) => (
                    <div
                      key={colour ?? "ink"}
                      data-anchor={i === 0 ? "swatch" : undefined}
                      className="relative"
                    >
                      <span
                        className={cn("block size-5 rounded-full", colour === null && INK_CLASS)}
                        style={colour ? { backgroundColor: colour } : undefined}
                      />
                      {i === 0 && (
                        <motion.span
                          style={{ opacity: picked, scale: ringScale }}
                          className="pointer-events-none absolute -inset-1 rounded-full ring-2 ring-primary"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </Control>
            </Arrive>

            <Arrive p={p} from={0.22} to={0.31}>
              <Control label="Width">
                <div
                  data-anchor="width"
                  className="relative flex h-8 w-full items-center justify-between rounded-md border border-border bg-background px-2.5 text-[11px] font-medium"
                >
                  <span className="relative flex-1">
                    <motion.span style={{ opacity: fitLabel }} className="absolute inset-0 flex items-center">
                      Fit
                    </motion.span>
                    <motion.span style={{ opacity: fullLabel }} className="absolute inset-0 flex items-center">
                      Full
                    </motion.span>
                    <span className="invisible">Full</span>
                  </span>
                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                </div>
              </Control>
            </Arrive>
          </div>
        </div>
      </Canvas>

      <Cursor x={cursorX} y={cursorY} opacity={cursorOpacity} pressed={pressed} />
    </Split>
  )
}

const PEEK = {
  punc: "text-neutral-500",
  tag: "text-sky-400",
  attr: "text-violet-400",
  str: "text-emerald-400",
  txt: "text-neutral-300",
} as const

type PeekToken = [keyof typeof PEEK, string]

const PEEK_LINES: PeekToken[][] = [
  [
    ["punc", "<"],
    ["tag", "table"],
    ["txt", " "],
    ["attr", "width"],
    ["punc", "="],
    ["str", '"600"'],
    ["punc", ">"],
  ],
  [
    ["txt", "  "],
    ["punc", "<"],
    ["tag", "td"],
    ["txt", " "],
    ["attr", "style"],
    ["punc", "="],
    ["str", '"padding:32px"'],
    ["punc", ">"],
  ],
  [["txt", "    Launch day is here"]],
]

function PeekLine({ p, index, line }: { p: MotionValue<number>; index: number; line: PeekToken[] }) {
  const from = 0.7 + index * 0.03
  const opacity = useTransform(p, (v) => phase(v, from, from + 0.05))
  const x = useTransform(p, (v) => mix(-5, 0, ease(phase(v, from, from + 0.05))))
  return (
    <motion.div style={{ opacity, x }}>
      {line.map(([kind, value], i) => (
        <span key={i} className={PEEK[kind]}>
          {value}
        </span>
      ))}
    </motion.div>
  )
}

function ExportScene({ p }: { p: MotionValue<number> }) {
  const stage = useRef<HTMLDivElement>(null)
  const anchors = useAnchors(stage)

  const pressAt = (v: number) => phase(v, 0.3, 0.34) * (1 - phase(v, 0.37, 0.41))
  const press = useTransform(p, pressAt)
  const buttonScale = useTransform(p, (v) => mix(1, 0.92, pressAt(v)))

  const ring = useTransform(p, (v) => ease(phase(v, 0.36, 0.56)))
  const ringOpacity = useTransform(p, (v) => 1 - phase(v, 0.6, 0.67))
  const arrow = useTransform(p, (v) => 1 - phase(v, 0.56, 0.59))
  const tick = useTransform(p, (v) => phase(v, 0.59, 0.62))
  const doneFill = useTransform(p, (v) => phase(v, 0.57, 0.62))

  const file = useTransform(p, (v) => phase(v, 0.63, 0.72))
  const fileY = useTransform(p, (v) => mix(14, 0, ease(phase(v, 0.63, 0.72))))
  const peek = useTransform(p, (v) => phase(v, 0.68, 0.76))

  const cursorX = useTransform(p, (v) => {
    const to = cx(anchors.button)
    const arrive = mix(to - 36, to, ease(phase(v, 0.2, 0.3)))
    return mix(arrive, to + 70, ease(phase(v, 0.44, 0.6)))
  })
  const cursorY = useTransform(p, (v) => {
    const to = cy(anchors.button)
    const below = (stage.current?.offsetHeight ?? 400) + 60
    const arrive = mix(below, to, ease(phase(v, 0.2, 0.3)))
    return mix(arrive, to - 58, ease(phase(v, 0.44, 0.6)))
  })
  const cursorOpacity = useTransform(p, (v) => phase(v, 0.2, 0.27) * (1 - phase(v, 0.5, 0.64)))

  return (
    <Split innerRef={stage}>
      <Copyblock step={STEPS[2]} progress={p} from={0.68} />

      <div className="relative order-1 flex h-72 items-center justify-center sm:h-88 lg:order-2 lg:h-104">
        <div className="flex flex-col items-center gap-7">
          <Arrive p={p} from={0.05} to={0.16}>
            <div data-anchor="button" className="relative size-24">
              <motion.svg
                viewBox="0 0 100 100"
                style={{ opacity: ringOpacity }}
                className="absolute inset-0 -rotate-90"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="47"
                  fill="none"
                  strokeWidth="2.5"
                  className="stroke-border"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="47"
                  fill="none"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="stroke-primary"
                  style={{ pathLength: ring }}
                />
              </motion.svg>

              <motion.div
                style={{ scale: buttonScale }}
                className="absolute inset-2.5 flex items-center justify-center rounded-full"
              >
                <span className="absolute inset-0 rounded-full bg-primary" />
                <motion.span
                  style={{ opacity: doneFill }}
                  className="absolute inset-0 rounded-full bg-success"
                />
                <motion.span
                  style={{ opacity: arrow }}
                  className="absolute inset-0 flex items-center justify-center text-primary-foreground"
                >
                  <Download className="size-7" />
                </motion.span>
                <motion.span
                  style={{ opacity: tick }}
                  className="absolute inset-0 flex items-center justify-center text-white dark:text-neutral-950"
                >
                  <Check className="size-7" strokeWidth={3} />
                </motion.span>
              </motion.div>
            </div>
          </Arrive>

          <motion.div
            aria-hidden
            style={{ opacity: file, y: fileY }}
            className="flex flex-col items-center gap-2 text-center"
          >
            <span className="text-sm font-semibold">launch-day.html</span>
            <motion.div
              style={{ opacity: peek }}
              className="mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-neutral-950 text-left"
            >
              <div className="flex items-center gap-1.5 border-b border-white/10 px-2.5 py-1.5">
                <span className="size-1.5 rounded-full bg-white/20" />
                <span className="size-1.5 rounded-full bg-white/20" />
                <span className="size-1.5 rounded-full bg-white/20" />
              </div>
              <pre className="flex gap-2.5 px-2.5 py-2 font-mono text-[10px] leading-[1.9] whitespace-pre">
                <span aria-hidden className="shrink-0 text-right text-neutral-600 select-none">
                  {PEEK_LINES.map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </span>
                <span className="min-w-0">
                  {PEEK_LINES.map((line, i) => (
                    <PeekLine key={i} p={p} index={i} line={line} />
                  ))}
                </span>
              </pre>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <Cursor x={cursorX} y={cursorY} opacity={cursorOpacity} pressed={press} />
    </Split>
  )
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full min-w-0 scroll-mt-20 border-t border-border">
      <div className="mx-auto max-w-5xl px-5 pt-20 sm:pt-24">
        <SectionHeader
          eyebrow="How it works"
          title="From blocks to inbox in three steps"
          lead="Compose it, style it, export it. No code at any point."
        />
      </div>

      <Scene>{(p) => <DragScene p={p} />}</Scene>
      <Scene>{(p) => <StyleScene p={p} />}</Scene>
      <Scene>{(p) => <ExportScene p={p} />}</Scene>
    </section>
  )
}
