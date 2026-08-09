import * as React from "react"

import { cn } from "@/lib/utils"

function Screen({
  className,
  center = false,
  ...props
}: React.ComponentProps<"div"> & { center?: boolean }) {
  return (
    <div
      data-slot="screen"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-6 p-4",
        center && "items-center justify-center",
        className
      )}
      {...props}
    />
  )
}

function ScreenHeader({ className, ...props }: React.ComponentProps<"header">) {
  return <header data-slot="screen-header" className={cn("space-y-1", className)} {...props} />
}

function ScreenTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1 data-slot="screen-title" className={cn("text-xl font-semibold", className)} {...props} />
  )
}

function ScreenDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="screen-description"
      className={cn("max-w-prose text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function ScreenSection({
  title,
  className,
  children,
  ...props
}: React.ComponentProps<"section"> & { title: string }) {
  return (
    <section data-slot="screen-section" className={cn("space-y-3", className)} {...props}>
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}

function ScreenGrid({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="screen-grid" className={cn("@container", className)} {...props}>
      <div className="grid grid-cols-1 items-start gap-4 @xl:grid-cols-2">{children}</div>
    </div>
  )
}

function ScreenGridItem({
  className,
  full = false,
  ...props
}: React.ComponentProps<"div"> & { full?: boolean }) {
  return (
    <div
      data-slot="screen-grid-item"
      className={cn(full && "@xl:col-span-2", className)}
      {...props}
    />
  )
}

Screen.Header = ScreenHeader
Screen.Title = ScreenTitle
Screen.Description = ScreenDescription
Screen.Section = ScreenSection
Screen.Grid = Object.assign(ScreenGrid, { Item: ScreenGridItem })

export { Screen }
