"use client"

import * as React from "react"

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

const KEY = "text-size"
const SIZES = ["text-base", "text-lg", "text-xl"] as const
export type TextSize = (typeof SIZES)[number]
const DEFAULT: TextSize = "text-base"

const LABELS: Record<TextSize, string> = {
  "text-base": "Default",
  "text-lg": "Large",
  "text-xl": "Larger",
}

export const textSizeScript = `(function(){try{var s=localStorage.getItem(${JSON.stringify(KEY)});document.documentElement.classList.add(${JSON.stringify(
  SIZES,
)}.indexOf(s)===-1?${JSON.stringify(DEFAULT)}:s)}catch(e){document.documentElement.classList.add(${JSON.stringify(
  DEFAULT,
)})}})()`

function apply(size: TextSize) {
  const root = document.documentElement
  root.classList.remove(...SIZES)
  root.classList.add(size)
}

export function TextSizeSelect({ className }: { className?: string }) {
  const [size, setSize] = React.useState<TextSize | undefined>(() => {
    if (typeof window === "undefined") return DEFAULT
    try {
      const saved = window.localStorage.getItem(KEY) as TextSize | null
      const next = saved && SIZES.includes(saved) ? saved : DEFAULT
      apply(next)
      return next
    } catch {
      return DEFAULT
    }
  })

  const change = (next: TextSize) => {
    setSize(next)
    apply(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
    }
  }

  return (
    <NativeSelect
      className={className}
      value={size ?? DEFAULT}
      onChange={(e) => change(e.target.value as TextSize)}
      disabled={!size}
    >
      {SIZES.map((s) => (
        <NativeSelectOption key={s} value={s}>
          {LABELS[s]}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}
