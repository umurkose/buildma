import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const statusVariants = cva("whitespace-nowrap", {
  variants: {
    tone: {
      muted: "text-muted-foreground",
      default: "text-foreground",
      success: "text-primary",
      primary: "text-primary",
      warning: "text-warning",
      danger: "text-destructive",
    },
  },
  defaultVariants: { tone: "muted" },
})

function Status({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof statusVariants>) {
  return <span data-slot="status" className={cn(statusVariants({ tone }), className)} {...props} />
}

export { Status }
