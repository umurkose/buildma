import { cn } from "@/lib/utils"
import { countries as COUNTRIES, flagSrc } from "@/lib/countries"

export type RankRow = {
  key: string
  label: string
  count: number
  leading?: React.ReactNode
  trailing?: React.ReactNode
}

export function RankTable({
  rows,
  total,
  limit,
  empty,
}: {
  rows: RankRow[]
  total?: number
  limit?: number
  empty: string
}) {
  const sum = total ?? rows.reduce((acc, row) => acc + row.count, 0)
  const shown = limit ? rows.slice(0, limit) : rows
  const rest = rows.length - shown.length

  if (rows.length === 0) return <p className="p-4 text-sm text-muted-foreground">{empty}</p>

  return (
    <>
      <table className="w-full text-sm">
        <tbody>
          {shown.map((row) => {
            const exact = sum ? (row.count / sum) * 100 : 0
            const share = exact > 0 && exact < 1 ? "<1" : Math.round(exact)
            return (
              <tr key={row.key} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 pr-2 pl-4">
                  <span className="flex min-w-0 items-center gap-2.5">
                    {row.leading}
                    <span className="truncate">{row.label}</span>
                    {row.trailing}
                  </span>
                </td>
                <td className="w-14 py-2.5 pr-2 text-right text-xs tabular-nums text-muted-foreground">
                  {share}%
                </td>
                <td className="w-16 py-2.5 pr-4 text-right font-medium tabular-nums">
                  {row.count.toLocaleString()}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {rest > 0 && (
        <p className={cn("border-t border-border/60 px-4 py-2 text-xs text-muted-foreground")}>
          +{rest} more
        </p>
      )}
    </>
  )
}

const PAGE_NAMES: Record<string, string> = {
  "/": "Home",
  "/editor": "Editor",
  "/auth/login": "Log in",
  "/auth/signup": "Sign up",
  "/auth/verify": "Verify",
  "/app": "Dashboard",
  other: "Other",
}

export function countryRows(rows: { country: string; count: number }[]): RankRow[] {
  return rows.map((row) => {
    const country = COUNTRIES.find((c) => c.code === row.country)
    return {
      key: row.country,
      label: country?.name ?? "Unknown",
      count: row.count,
      leading: country ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={flagSrc(country.code)}
          alt=""
          className="h-3.5 w-5 shrink-0 rounded-xs object-cover ring-1 ring-border"
        />
      ) : (
        <span aria-hidden className="h-3.5 w-5 shrink-0 rounded-xs ring-1 ring-border" />
      ),
    }
  })
}

export function pageRows(rows: { path: string; count: number }[]): RankRow[] {
  return rows.map((row) => ({
    key: row.path,
    label: PAGE_NAMES[row.path] ?? row.path,
    count: row.count,
    trailing:
      row.path === "other" ? null : (
        <span className="shrink-0 font-mono text-xs text-muted-foreground">{row.path}</span>
      ),
  }))
}
