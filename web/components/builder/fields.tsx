"use client"

import { useState, type ReactNode } from "react"
import { AlignCenter, AlignLeft, AlignRight, X, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { IndicatorFill, useIndicator } from "@/components/ui/indicator"
import { FONT_KEYS, FONT_WEIGHTS, FONTS, type Align, type Doc, type FontKey } from "@/components/builder/store"

// The inspector's building blocks. Every control is one of these, so the panel has
// one rhythm: titled sections, labels at one size, rows that line up.

const LABEL = "text-xs font-medium text-foreground/80"

/** A titled group of controls. */
export function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-border px-4 py-4">
      <div className="flex h-5 items-center justify-between gap-2">
        <h4 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {title}
        </h4>
        {action}
      </div>
      {children}
    </section>
  )
}

/** A label above its control, with an optional hint below. */
export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string
  hint?: ReactNode
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={htmlFor} className={LABEL}>
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** A label and a compact control on one line. */
export function Row({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-3">
      <Label htmlFor={htmlFor} className={cn(LABEL, "shrink-0")}>
        {label}
      </Label>
      {children}
    </div>
  )
}

export function SwitchRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <Row label={label} htmlFor={id}>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </Row>
  )
}

/** One choice out of a few, as a segmented control with a sliding highlight. */
export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string; icon?: LucideIcon }[]
  onChange: (value: T) => void
}) {
  const { ref, pill } = useIndicator<HTMLDivElement>({
    active: '[data-seg][data-active="true"]',
    item: "[data-seg]",
    axis: "x",
  })

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      className="relative inline-flex h-8 w-full items-center rounded-full bg-muted p-[3px] text-muted-foreground"
    >
      <span {...pill("rounded-full bg-primary")} />
      {options.map((option) => {
        const active = option.value === value
        const Icon = option.icon
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            title={option.label}
            data-seg
            data-active={active}
            onClick={() => onChange(option.value)}
            className="relative z-10 inline-flex h-[calc(100%-1px)] min-w-0 flex-1 items-center justify-center rounded-full px-2 text-xs font-medium transition-colors outline-none select-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <IndicatorFill layout="inline-flex items-center justify-center">
              {Icon ? <Icon className="size-4" /> : <span className="truncate">{option.label}</span>}
            </IndicatorFill>
          </button>
        )
      })}
    </div>
  )
}

const ALIGNMENTS: { value: Align; label: string; icon: LucideIcon }[] = [
  { value: "left", label: "Left", icon: AlignLeft },
  { value: "center", label: "Center", icon: AlignCenter },
  { value: "right", label: "Right", icon: AlignRight },
]

export function AlignField({ value, onChange }: { value: Align; onChange: (value: Align) => void }) {
  return (
    <Row label="Align">
      <div className="w-36">
        <Segmented label="Alignment" value={value} options={ALIGNMENTS} onChange={onChange} />
      </div>
    </Row>
  )
}

export function SliderField({
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
  const show = (v: number) => `${format ? format(v) : v}${suffix}`
  return (
    <div className={cn("flex flex-col gap-2.5", disabled && "opacity-50")}>
      <div className="flex items-center justify-between gap-3">
        <Label className={LABEL}>{label}</Label>
        <span className="min-w-10 rounded-md bg-muted px-1.5 py-0.5 text-center text-[11px] font-medium tabular-nums text-muted-foreground">
          {show(value)}
        </span>
      </div>
      <Slider
        disabled={disabled}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        formatTooltip={show}
      />
    </div>
  )
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

/** "#abc", "abc", "#aabbcc" or "aabbcc" → "#aabbcc"; anything else → null. */
export function normalizeHex(raw: string): string | null {
  const m = HEX.exec(raw.trim())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1]
  return `#${h.toLowerCase()}`
}

const CHECKER =
  "repeating-conic-gradient(#d4d4d4 0% 25%, #ffffff 0% 50%) 50% / 8px 8px"

/**
 * A colour as one compact row: swatch (opens the system picker) and hex. Typing only
 * commits a valid colour, so a half-typed "#2f" never reaches the email; leaving the
 * field drops whatever was invalid. `allowNone` adds a clear button for fills that
 * may be transparent.
 */
export function ColorField({
  label,
  value,
  onChange,
  allowNone,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  allowNone?: boolean
}) {
  const none = !value || value === "transparent"
  const valid = normalizeHex(value)
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? (none ? "" : (valid ?? value).toUpperCase())

  return (
    <Row label={label}>
      <div className="flex h-8 w-36 items-center gap-1.5 rounded-lg border border-input bg-background pr-1 pl-1 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 dark:bg-input/30">
        <label
          className="relative size-6 shrink-0 cursor-pointer overflow-hidden rounded-md ring-1 ring-black/10 dark:ring-white/15"
          style={{ background: none ? CHECKER : (valid ?? "#ffffff") }}
        >
          <span className="sr-only">{`Pick ${label.toLowerCase()} colour`}</span>
          <input
            type="color"
            value={valid ?? "#ffffff"}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
        <input
          aria-label={`${label} hex`}
          value={shown}
          placeholder={none ? "None" : undefined}
          spellCheck={false}
          maxLength={7}
          onChange={(event) => {
            setDraft(event.target.value)
            const next = normalizeHex(event.target.value)
            if (next) onChange(next)
          }}
          onBlur={() => setDraft(null)}
          className="min-w-0 flex-1 bg-transparent font-mono text-xs uppercase outline-none placeholder:normal-case placeholder:text-muted-foreground"
        />
        {allowNone && !none && (
          <button
            type="button"
            aria-label={`Clear ${label.toLowerCase()}`}
            title="No colour"
            onClick={() => onChange("transparent")}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </Row>
  )
}

export function FontField({
  value,
  doc,
  onChange,
  inheritable = true,
}: {
  value: FontKey | null
  doc: Doc
  onChange: (value: FontKey | null) => void
  inheritable?: boolean
}) {
  return (
    <Field label="Font">
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
            Match email — {FONTS[doc.fontFamily].label}
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

export function WeightField({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <Row label="Weight">
      <NativeSelect
        size="sm"
        className="w-36"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {FONT_WEIGHTS.map((weight) => (
          <NativeSelectOption key={weight.value} value={weight.value}>
            {weight.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Row>
  )
}
