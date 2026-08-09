import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon data-slot="spinner" role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} {...props} />
  )
}

function Loading({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="loading"
      className={cn("flex h-full w-full flex-1 items-center justify-center", className)}
      {...props}
    >
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  )
}

export { Spinner, Loading }
