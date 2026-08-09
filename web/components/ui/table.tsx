"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  ChevronsUpDown,
  Pencil,
  RefreshCw,
  Search,
  X,
} from "lucide-react"

import type { ColumnDef, SortingState } from "@/types"
import { Button } from "@/components/ui/button"
import { useAccent } from "@/core/client"
import { Copy } from "@/components/ui/copy"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Kbd } from "@/components/ui/kbd"
import { toast } from "@/components/ui/sonner"
import { useSidebar } from "@/components/ui/sidebar"
import { TopbarPortal } from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"

// --- Markup (private: these exist to build the table above, nothing else) ---

const Root = ({ className, ...props }: React.ComponentProps<"table">) => (
  <div data-slot="table-container" className="relative w-full overflow-x-auto">
    <table
      data-slot="table"
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
)

const Head = ({ className, ...props }: React.ComponentProps<"thead">) => (
  <thead
    data-slot="table-header"
    className={cn("[&_tr]:border-b [&_tr]:border-border/60", className)}
    {...props}
  />
)

const Body = ({ className, ...props }: React.ComponentProps<"tbody">) => (
  <tbody
    data-slot="table-body"
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
)

const TableRow = ({ className, ...props }: React.ComponentProps<"tr">) => (
  <tr
    data-slot="table-row"
    className={cn(
      "group/row border-b border-border/60 transition-colors has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
      "data-clickable:cursor-pointer data-clickable:select-none data-clickable:active:bg-muted",
      "data-clickable:hover:not-data-[state=selected]:bg-muted/40",
      "data-clickable:focus-visible:outline-2 data-clickable:focus-visible:-outline-offset-2 data-clickable:focus-visible:outline-primary/50",
      className,
    )}
    {...props}
  />
)

const HeadCell = ({ className, ...props }: React.ComponentProps<"th">) => (
  <th
    data-slot="table-head"
    className={cn(
      "h-11 px-5 text-left align-middle text-[0.8125rem] font-medium tracking-[-0.005em] whitespace-nowrap text-muted-foreground has-[[role=checkbox]]:pr-0",
      className,
    )}
    {...props}
  />
)

const Cell = ({ className, ...props }: React.ComponentProps<"td">) => (
  <td
    data-slot="table-cell"
    className={cn(
      "px-5 py-3.5 align-middle text-[0.9375rem] tabular-nums whitespace-nowrap has-[[role=checkbox]]:pr-0",
      className,
    )}
    {...props}
  />
)

// --- Internals ---

const DISCLOSURE = "__disclosure"

const DISCLOSURE_W = "w-16"

const SEARCH_HIGHLIGHT = "table-search"

let highlightSheet: CSSStyleSheet | null = null
function styleHighlight(accent: string) {
  if (typeof document === "undefined" || !("adoptedStyleSheets" in document)) return
  if (!highlightSheet) {
    highlightSheet = new CSSStyleSheet()
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, highlightSheet]
  }
  highlightSheet.replaceSync(
    `::highlight(${SEARCH_HIGHLIGHT}) { background-color: color-mix(in oklab, ${accent} 22%, var(--background)); color: var(--foreground); }`,
  )
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (!sorted)
    return (
      <ChevronsUpDown className="size-3.5 shrink-0 text-primary/50 transition-colors group-hover/sort:text-primary group-focus-visible/sort:text-primary" />
    )
  const Arrow = sorted === "asc" ? ArrowUp : ArrowDown
  return <Arrow className="size-3.5 shrink-0 text-primary" />
}

const isEmpty = (v: unknown) => v === null || v === undefined || v === ""

const defaultColumn = {
  cell: ({ getValue }: { getValue: () => unknown }) => {
    const value = getValue()
    return isEmpty(value) ? <span className="text-muted-foreground">—</span> : String(value)
  },
}

// --- Props ---

interface TableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  globalSearch?: boolean
  searchPlaceholder?: string
  label?: string
  paginate?: boolean
  rowHref?: (row: TData) => string
  fixed?: boolean
  defaultSort?: SortingState
  refreshable?: boolean
  onRefresh?: () => void
  getRowId?: (row: TData) => string
  topbar?: boolean
}

export function Table<TData, TValue>({
  columns,
  data,
  searchKey,
  globalSearch = false,
  searchPlaceholder = "Search…",
  label,
  paginate = true,
  rowHref,
  fixed = false,
  defaultSort,
  refreshable = false,
  onRefresh,
  getRowId,
  topbar = false,
}: TableProps<TData, TValue>) {
  const { isMobile } = useSidebar()
  const accent = useAccent()
  const [sorting, setSorting] = React.useState<SortingState>(defaultSort ?? [])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")

  const router = useRouter()
  const pathname = usePathname()
  const query = useSearchParams().toString()
  const current = query ? `${pathname}?${query}` : pathname

  const clickable = !!rowHref
  const allColumns = React.useMemo<ColumnDef<TData, TValue>[]>(
    () =>
      clickable
        ? [
            ...columns,
            {
              id: DISCLOSURE,
              enableSorting: false,
              header: () => <span className="sr-only">Open</span>,
              cell: () => (
                <div className="flex justify-end">
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground/70 transition-colors group-hover/row:text-primary" />
                </div>
              ),
            },
          ]
        : columns,
    [columns, clickable],
  )

  const table = useReactTable({
    data,
    columns: allColumns,
    defaultColumn,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: paginate ? getPaginationRowModel() : undefined,
    getRowId,
  })

  const searchColumn = searchKey ? table.getColumn(searchKey) : undefined
  const searchable = globalSearch || !!searchColumn
  const search = globalSearch ? globalFilter : ((searchColumn?.getFilterValue() as string) ?? "")
  const setSearch = (value: string) =>
    globalSearch ? setGlobalFilter(value) : searchColumn?.setFilterValue(value)
  const rows = table.getRowModel().rows
  const count = table.getFilteredRowModel().rows.length

  const bodyRef = React.useRef<HTMLTableSectionElement>(null)
  React.useEffect(() => {
    styleHighlight(accent)
    const store = typeof CSS !== "undefined" ? CSS.highlights : undefined
    if (!store) return
    const body = bodyRef.current
    const needle = search.trim().toLowerCase()
    if (!body || !needle) {
      store.delete(SEARCH_HIGHLIGHT)
      return
    }

    const ranges: Range[] = []
    const walk = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
    for (let node = walk.nextNode(); node; node = walk.nextNode()) {
      const text = node.nodeValue?.toLowerCase()
      if (!text) continue
      for (let i = text.indexOf(needle); i !== -1; i = text.indexOf(needle, i + needle.length)) {
        const range = document.createRange()
        range.setStart(node, i)
        range.setEnd(node, i + needle.length)
        ranges.push(range)
      }
    }
    if (ranges.length) store.set(SEARCH_HIGHLIGHT, new Highlight(...ranges))
    else store.delete(SEARCH_HIGHLIGHT)
    return () => {
      store.delete(SEARCH_HIGHLIGHT)
    }
  }, [search, rows, accent])

  const [flashed, setFlashed] = React.useState<ReadonlySet<string>>(new Set())
  const seen = React.useRef<Set<string> | null>(null)
  const signature = getRowId ? data.map(getRowId).join(",") : ""
  React.useEffect(() => {
    if (!getRowId) return
    const current = new Set(data.map(getRowId))
    const prev = seen.current
    if (!prev) {
      if (current.size) seen.current = current
      return
    }
    seen.current = current
    const fresh = [...current].filter((id) => !prev.has(id))
    if (!fresh.length) return
    setFlashed((s) => new Set([...s, ...fresh]))
    setTimeout(() => setFlashed((s) => new Set([...s].filter((id) => !fresh.includes(id)))), 2000)
  }, [signature])

  const inTopbar = topbar && !isMobile

  const searchBox = searchable ? (
    <InputGroup className={cn("min-w-0 flex-1 sm:max-w-xs", inTopbar && "order-first w-auto")}>
      <InputGroupAddon align="inline-start">
        <Search className="group-has-[[data-slot=input-group-control]:focus-visible]/input-group:text-primary" />
      </InputGroupAddon>
      <InputGroupInput
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <InputGroupAddon align="inline-end">
        <span className="text-xs text-muted-foreground tabular-nums">
          {count}
          {label ? ` ${label}` : ""}
        </span>
        {search && (
          <InputGroupButton aria-label="Clear search" onClick={() => setSearch("")}>
            <X />
          </InputGroupButton>
        )}
      </InputGroupAddon>
    </InputGroup>
  ) : (
    <span className="text-sm text-muted-foreground tabular-nums">
      {count}
      {label ? ` ${label}` : ""}
    </span>
  )

  const refreshBtn = refreshable ? <Refresh onRefresh={onRefresh} /> : null

  const paging = paginate ? (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        Next
      </Button>
    </div>
  ) : null

  return (
    <div className="space-y-4">
      {inTopbar ? (
        <>
          <TopbarPortal>
            {searchBox}
            {refreshBtn}
          </TopbarPortal>
          {paging && <div className="flex justify-end">{paging}</div>}
        </>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {searchBox}
            {refreshBtn}
          </div>
          {paging}
        </div>
      )}

      {rows.length ? (
        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <Root className={fixed ? "table-fixed" : undefined}>
            <Head>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <HeadCell
                      key={header.id}
                      className={header.column.id === DISCLOSURE ? DISCLOSURE_W : undefined}
                      aria-sort={
                        header.column.getIsSorted() === "asc"
                          ? "ascending"
                          : header.column.getIsSorted() === "desc"
                            ? "descending"
                            : undefined
                      }
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="-mx-2 inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 whitespace-nowrap transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIcon sorted={header.column.getIsSorted()} />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </HeadCell>
                  ))}
                </TableRow>
              ))}
            </Head>
            <Body ref={bodyRef}>
              {rows.map((row) => {
                const href = rowHref?.(row.original)
                const open = () => href && router.push(href, { scroll: false })
                const menu = (
                  <TableRow
                    className={flashed.has(row.id) ? "row-flash" : undefined}
                    data-clickable={clickable ? "" : undefined}
                    data-state={href && href === current ? "selected" : undefined}
                    aria-selected={href ? href === current : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    onClick={open}
                    onKeyDown={(e) => {
                      if (!clickable || (e.key !== "Enter" && e.key !== " ")) return
                      e.preventDefault()
                      open()
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta
                      const value = cell.getValue()
                      const content = flexRender(cell.column.columnDef.cell, cell.getContext())
                      return (
                        <Cell
                          key={cell.id}
                          className={cn(
                            cell.column.id === DISCLOSURE && DISCLOSURE_W,
                            meta?.mono && "font-mono",
                            meta?.muted && "text-muted-foreground",
                          )}
                        >
                          {meta?.copy && !isEmpty(value) ? (
                            <Copy value={String(value)}>{content}</Copy>
                          ) : (
                            content
                          )}
                        </Cell>
                      )
                    })}
                  </TableRow>
                )

                if (!href) return <React.Fragment key={row.id}>{menu}</React.Fragment>

                return (
                  <ContextMenu key={row.id}>
                    <ContextMenuTrigger asChild>{menu}</ContextMenuTrigger>
                    <ContextMenuContent className="w-40 [&_svg]:text-primary">
                      <ContextMenuItem onClick={open}>
                        <Pencil />
                        Edit
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                )
              })}
            </Body>
          </Root>
        </div>
      ) : (
        <Empty className="rounded-2xl border border-border/60">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>No results</EmptyTitle>
            <EmptyDescription>
              {search ? `Nothing matches “${search}”.` : `No ${label ?? "items"} to show yet.`}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}

function Refresh({ onRefresh }: { onRefresh?: () => void }) {
  const router = useRouter()
  const [spinning, setSpinning] = React.useState(false)

  const refresh = React.useCallback(() => {
    setSpinning(true)
    const id = toast.loading("Reloading…")
    if (onRefresh) onRefresh()
    else router.refresh()
    setTimeout(() => toast.success("Reloaded", { id }), 600)
  }, [router, onRefresh])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        refresh()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [refresh])

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Refresh" onClick={refresh}>
            <RefreshCw
              className={cn("size-3.5", spinning && "animate-spin repeat-1")}
              onAnimationEnd={() => setSpinning(false)}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Refresh</TooltipContent>
      </Tooltip>
      <span className="hidden shrink-0 items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground sm:inline-flex">
        <Kbd>⌘K</Kbd>
        to refresh
      </span>
    </div>
  )
}
