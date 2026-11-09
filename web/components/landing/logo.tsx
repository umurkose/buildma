import { cn } from "@/lib/utils"

// The Blokma mark as a toy: the same three bars as components/ui/logo.tsx in the
// two candy colours, set on an ink tile so the yellow still reads on paper.
export function BlockLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      focusable="false"
      className={cn("size-7 shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" fill="var(--ink)" />
      <rect x="6" y="7.5" width="20" height="4.5" rx="2.25" fill="var(--candy-sun)" />
      <rect x="6" y="13.75" width="14" height="4.5" rx="2.25" fill="var(--candy-sky)" />
      <rect x="6" y="20" width="9" height="4.5" rx="2.25" fill="var(--candy-sun)" />
    </svg>
  )
}
