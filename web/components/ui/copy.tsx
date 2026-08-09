"use client"

import * as React from "react"
import { Check, Copy as CopyIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export function Copy({
  value,
  children,
  className,
}: {
  value: string
  children?: React.ReactNode
  className?: string
}) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  return (
    <button
      type="button"
      title={copied ? "Copied" : "Copy"}
      onClick={(e) => {
        e.stopPropagation()
        navigator.clipboard.writeText(value).then(() => setCopied(true))
      }}
      className={cn(
        "group/copy inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-left transition-colors hover:text-primary",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      {children ?? value}
      {copied ? (
        <Check className="size-3.5 shrink-0 text-primary" />
      ) : (
        <CopyIcon className="size-3.5 shrink-0 text-primary opacity-0 transition-opacity group-hover/copy:opacity-100 group-focus-visible/copy:opacity-100" />
      )}
    </button>
  )
}
