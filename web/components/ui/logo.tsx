import { APP_NAME } from "@/core/meta"
import { cn } from "@/lib/utils"

export function Logo({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden
      focusable="false"
      className={cn("size-5 shrink-0", className)}
      {...props}
    >
      <rect x="2" y="4.5" width="28" height="5" rx="2.5" />
      <rect x="2" y="13.5" width="19" height="5" rx="2.5" fillOpacity="0.5" />
      <rect x="2" y="22.5" width="12" height="5" rx="2.5" />
    </svg>
  )
}

export function Wordmark({
  className,
  markClassName,
  ...props
}: React.ComponentProps<"span"> & { markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)} {...props}>
      <Logo className={cn("text-foreground", markClassName)} />
      <span className="font-semibold tracking-tight">{APP_NAME}</span>
    </span>
  )
}
