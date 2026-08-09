import { Star } from "lucide-react"

import { cn } from "@/lib/utils"

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-primary", className)}
      aria-label={`${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)))
        return (
          <span key={i} className="relative inline-flex">
            <Star className="size-3.5 fill-transparent text-muted-foreground/35" />
            {fill > 0 && (
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star className="size-3.5 fill-current" />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}
