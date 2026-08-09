"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { countries, flagSrc, splitPhone, type Country } from "@/lib/countries"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-full border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

const lookup = (code: string) => countries.find((c) => c.code === code.toUpperCase())

function Flag({ code, className }: { code: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flagSrc(code)}
      alt=""
      className={cn("h-3.5 w-5 shrink-0 rounded-xs object-cover", className)}
    />
  )
}

export function PhoneInput({
  value,
  onChange,
  defaultCountry = "TR",
  disabled,
  className,
  placeholder = "555 111 22 33",
}: {
  value: string
  onChange: (value: string) => void
  defaultCountry?: string
  disabled?: boolean
  className?: string
  placeholder?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [picked, setPicked] = React.useState<Country>()

  const [matched, national] = splitPhone(value)
  const country = matched ?? picked ?? lookup(defaultCountry) ?? countries[0]

  const results = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return countries
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase() === q,
    )
  }, [search])

  const emit = (next: Country, digits: string) => onChange(digits ? `${next.dial}${digits}` : "")

  const pick = (next: Country) => {
    setPicked(next)
    emit(next, national)
    setOpen(false)
    setSearch("")
  }

  const typeNumber = (input: string) => {
    const digits = input.replace(/\D/g, "")
    if (input.trimStart().startsWith("+")) return onChange(digits ? `+${digits}` : "")
    emit(country, digits)
  }

  return (
    <div className={cn("flex gap-2", className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="h-9 shrink-0 gap-1.5 px-2.5 font-normal tabular-nums"
          >
            <Flag code={country.code} />
            {country.dial}
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
            <span className="sr-only">Change country ({country.name})</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-72 p-0">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Search country…"
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-1">
            {results.length ? (
              results.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => pick(c)}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm select-none hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                >
                  <Flag code={c.code} />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{c.dial}</span>
                  {c.code === country.code && <Check className="size-3.5" />}
                </button>
              ))
            ) : (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">No country found.</p>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        disabled={disabled}
        value={national}
        onChange={(e) => typeNumber(e.target.value)}
        placeholder={placeholder}
        className="tabular-nums"
      />
    </div>
  )
}

export { Input }
