// --- Dates ---

const TZ = { timeZone: "Europe/Istanbul" } as const

const DATE = new Intl.DateTimeFormat("en-US", {
  ...TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
})
const DATE_TIME = new Intl.DateTimeFormat("en-US", {
  ...TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})
const TIME = new Intl.DateTimeFormat("en-US", {
  ...TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})
const DAY = new Intl.DateTimeFormat("en-CA", TZ)

const isToday = (d: Date) => DAY.format(d) === DAY.format(new Date())

export function formatDate(iso?: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return isToday(d) ? TIME.format(d) : DATE.format(d)
}

export function formatDateTime(iso?: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return isToday(d) ? TIME.format(d) : DATE_TIME.format(d)
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  return kb < 100 ? `${kb.toFixed(1)} KB` : `${Math.round(kb)} KB`
}
