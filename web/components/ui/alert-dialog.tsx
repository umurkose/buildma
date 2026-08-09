"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"
import type { VariantProps } from "class-variance-authority"
import { TriangleAlert, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function AlertDialog(
  props: React.ComponentProps<typeof AlertDialogPrimitive.Root>
) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger(
  props: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>
) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 duration-200 ease-out supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal">
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-200 ease-out outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  )
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("font-heading text-base leading-none font-medium", className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> &
  Pick<VariantProps<typeof buttonVariants>, "variant">) {
  return (
    <AlertDialogPrimitive.Action
      data-slot="alert-dialog-action"
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      data-slot="alert-dialog-cancel"
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  )
}

// --- Imperative API ---

type AlertOptions = {
  title: string
  description?: string
  action?: string
  cancel?: string
  destructive?: boolean
  icon?: LucideIcon
}

let show: ((opts: AlertOptions, resolve: (ok: boolean) => void) => void) | null = null

function alert(opts: AlertOptions): Promise<boolean> {
  if (!show) return Promise.resolve(false)
  return new Promise((resolve) => show!(opts, resolve))
}

function AlertDialogHost() {
  const [opts, setOpts] = React.useState<AlertOptions | null>(null)
  const [open, setOpen] = React.useState(false)
  const resolver = React.useRef<((ok: boolean) => void) | null>(null)

  React.useEffect(() => {
    show = (o, resolve) => {
      resolver.current?.(false)
      resolver.current = resolve
      setOpts(o)
      setOpen(true)
    }
    return () => {
      show = null
    }
  }, [])

  const settle = (ok: boolean) => {
    resolver.current?.(ok)
    resolver.current = null
    setOpen(false)
  }

  const destructive = opts?.destructive !== false
  const Icon = opts?.icon ?? TriangleAlert

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && settle(false)}>
      <AlertDialogContent className="gap-5 p-6 text-center">
        <div
          className={cn(
            "mx-auto flex size-12 items-center justify-center rounded-full",
            destructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-6" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <AlertDialogTitle className="text-lg">{opts?.title}</AlertDialogTitle>
          {opts?.description && (
            <AlertDialogDescription className="text-pretty">{opts.description}</AlertDialogDescription>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <AlertDialogCancel className="w-full">{opts?.cancel ?? "Cancel"}</AlertDialogCancel>
          <AlertDialogAction
            className="w-full"
            variant={destructive ? "destructive" : "default"}
            onClick={() => settle(true)}
          >
            {opts?.action ?? "Continue"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export {
  alert,
  AlertDialogHost,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
