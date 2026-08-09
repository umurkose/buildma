import type { LucideIcon } from "lucide-react"

// --- Stat ---

// One number, inline. No card: these are the figures you glance at before reading the
// chart under them, and four boxed tiles were four objects competing with the two that
// matter. Label, its qualifier in brackets, then the value.
export function Stat({
  label,
  value,
  note,
  icon: Icon,
  children,
}: {
  label: string
  value?: string | number
  note?: string
  icon?: LucideIcon
  children?: React.ReactNode
}) {
  return (
    <span className="flex items-center gap-2 text-sm">
      {Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground" />}
      <span className="text-muted-foreground">
        {label}
        {note && <span className="ml-1 tabular-nums">({note})</span>}
      </span>
      {children ?? (
        <span className="font-medium tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
      )}
    </span>
  )
}
