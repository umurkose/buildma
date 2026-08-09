"use client"

import { useTheme } from "next-themes"
import * as React from "react"

import { cn } from "@/lib/utils"

const KEY = "primary-color"
const HEX = /^#[0-9a-f]{6}$/i

const DEFAULT = "#3b82f6"

const PRESETS: readonly { hex: string; label: string }[] = [
  { hex: DEFAULT, label: "Blue (default)" },
  { hex: "#6366f1", label: "Indigo" },
  { hex: "#8b5cf6", label: "Violet" },
  { hex: "#059669", label: "Emerald" },
  { hex: "#e11d48", label: "Rose" },
  { hex: "#ea580c", label: "Orange" },
]

const TOKENS = ["--pick-light", "--pick-dark", "--pick-fg-light", "--pick-fg-dark"]

const SURFACE = { light: 0.985 ** 3, dark: 0.205 ** 3 }

const MIN = 3

const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
const toGamma = (c: number) => (c <= 0.00304 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)

const channels = (hex: string) =>
  [1, 3, 5].map((i) => toLinear(parseInt(hex.slice(i, i + 2), 16) / 255))

const luminance = (rgb: number[]) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]

const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

function fit(hex: string, bg: number) {
  const rgb = channels(hex)
  const L = luminance(rgb)
  if (contrast(L, bg) >= MIN) return hex

  const down = (bg + 0.05) / MIN - 0.05
  const up = MIN * (bg + 0.05) - 0.05
  const target = down >= 0 && (up > 1 || L - down <= up - L) ? down : up

  const edge = target > L ? 1 : 0
  const t = (target - L) / (edge - L)
  const round = edge ? Math.ceil : Math.floor
  return (
    "#" +
    rgb
      .map((c) => Math.min(255, Math.max(0, round(toGamma(c + t * (edge - c)) * 255))))
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")
  )
}

const FG_MIN = 3

function foreground(hex: string) {
  return 1.05 / (luminance(channels(hex)) + 0.05) >= FG_MIN ? "#fff" : "#000"
}

function values(hex: string) {
  const light = fit(hex, SURFACE.light)
  const dark = fit(hex, SURFACE.dark)
  return [light, dark, foreground(light), foreground(dark)]
}

function apply(hex: string) {
  const style = document.documentElement.style
  if (hex === DEFAULT) {
    for (const token of TOKENS) style.removeProperty(token)
    return
  }
  values(hex).forEach((value, i) => style.setProperty(TOKENS[i], value))
}

export const primaryColorScript = `(function(){try{var v=localStorage.getItem(${JSON.stringify(
  KEY,
)});if(!${String(HEX)}.test(v||"")||v.toLowerCase()===${JSON.stringify(
  DEFAULT,
)})return;v=v.toLowerCase();var f=function(c){return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)},g=function(c){return c<=0.00304?c*12.92:1.055*Math.pow(c,1/2.4)-0.055},p=function(h){return[f(parseInt(h.slice(1,3),16)/255),f(parseInt(h.slice(3,5),16)/255),f(parseInt(h.slice(5,7),16)/255)]},l=function(r){return 0.2126*r[0]+0.7152*r[1]+0.0722*r[2]},r=p(v),L=l(r),m=${MIN},fit=function(b){if((Math.max(L,b)+0.05)/(Math.min(L,b)+0.05)>=m)return v;var d=(b+0.05)/m-0.05,u=m*(b+0.05)-0.05,t=d>=0&&(u>1||L-d<=u-L)?d:u,e=t>L?1:0,k=(t-L)/(e-L),s="#";for(var i=0;i<3;i++){var n=g(r[i]+k*(e-r[i]))*255;n=Math.min(255,Math.max(0,e?Math.ceil(n):Math.floor(n)));s+=(n<16?"0":"")+n.toString(16)}return s},fg=function(h){return 1.05/(l(p(h))+0.05)>=${FG_MIN}?"#fff":"#000"},a=fit(${
  SURFACE.light
}),c=fit(${SURFACE.dark}),y=document.documentElement.style,t=${JSON.stringify(
  TOKENS,
)},w=[a,c,fg(a),fg(c)];for(var i=0;i<4;i++)y.setProperty(t[i],w[i])}catch(e){}})()`

const SWATCH =
  "size-7 shrink-0 rounded-full border border-black/10 outline-2 outline-offset-2 outline-transparent focus-visible:outline-foreground focus-visible:outline-dashed dark:border-white/15"

export function PrimaryColorPicker({ className }: { className?: string }) {
  const [color, setColor] = React.useState<string | undefined>(() => {
    if (typeof window === "undefined") return DEFAULT
    try {
      const saved = window.localStorage.getItem(KEY)
      const next = saved && HEX.test(saved) ? saved.toLowerCase() : DEFAULT
      if (next !== DEFAULT) apply(next)
      return next
    } catch {
      return DEFAULT
    }
  })

  const pending = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  const flush = React.useRef<() => void>(undefined)
  React.useEffect(
    () => () => {
      clearTimeout(pending.current)
      flush.current?.()
    },
    [],
  )

  const change = (next: string) => {
    const hex = next.toLowerCase()
    setColor(hex)
    apply(hex)
    flush.current = () => {
      flush.current = undefined
      try {
        if (hex === DEFAULT) localStorage.removeItem(KEY)
        else localStorage.setItem(KEY, hex)
      } catch {
      }
    }
    clearTimeout(pending.current)
    pending.current = setTimeout(() => flush.current?.(), 150)
  }

  const current = color ?? DEFAULT
  const custom = !PRESETS.some((p) => p.hex === current)

  const { resolvedTheme } = useTheme()
  const shown = color ? values(current)[resolvedTheme === "dark" ? 1 : 0] : current

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {PRESETS.map((preset) => (
        <button
          key={preset.hex}
          type="button"
          title={preset.label}
          aria-label={preset.label}
          aria-pressed={current === preset.hex}
          disabled={!color}
          onClick={() => change(preset.hex)}
          style={{ backgroundColor: preset.hex }}
          className={cn(SWATCH, "aria-pressed:outline-foreground")}
        />
      ))}

      <label
        title="Custom"
        className={cn(
          SWATCH,
          "relative cursor-pointer focus-within:outline-foreground focus-within:outline-dashed",
          custom && "outline-foreground",
          !color && "pointer-events-none",
        )}
        style={
          custom
            ? { backgroundColor: shown }
            : {
                backgroundImage:
                  "conic-gradient(from 90deg, #e11d48, #ea580c, #eab308, #059669, #06b6d4, #3b82f6, #8b5cf6, #e11d48)",
              }
        }
      >
        <span className="sr-only">Custom colour</span>
        <input
          type="color"
          value={current}
          disabled={!color}
          onChange={(e) => change(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  )
}
