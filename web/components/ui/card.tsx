import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva("flex flex-col overflow-hidden rounded-xl border", {
  variants: {
    variant: {
      default: "border-border",
      destructive: "border-destructive/40",
    },
  },
  defaultVariants: { variant: "default" },
})

function Card({
  className,
  variant,
  ...props
}: React.ComponentProps<"section"> & VariantProps<typeof cardVariants>) {
  return (
    <section
      data-slot="card"
      data-variant={variant}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "space-y-1 bg-muted/40 p-4 not-last:border-b not-last:border-border",
        "in-data-[variant=destructive]:border-destructive/40 in-data-[variant=destructive]:bg-destructive/5",
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 data-slot="card-title" className={cn("font-medium", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("max-w-prose text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("flex flex-1 flex-col justify-center bg-background p-4", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-3",
        "in-data-[variant=destructive]:border-destructive/40 in-data-[variant=destructive]:bg-destructive/5",
        className,
      )}
      {...props}
    />
  )
}

function CardHint({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-hint"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardHint }
