import type { ReactNode } from "react"

export function Row({
  label,
  action,
  children,
}: {
  label: string
  action?: ReactNode
  children: ReactNode
}) {
  const empty = children == null || children === "" || children === false
  return (
    <div className="grid min-h-8 grid-cols-[7rem_1fr_auto] items-center gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 text-sm wrap-break-word">
        {empty ? <span className="text-muted-foreground">—</span> : children}
      </span>
      {action}
    </div>
  )
}
