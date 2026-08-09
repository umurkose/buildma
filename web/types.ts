import type { RowData } from "@tanstack/react-table"

export type { ColumnDef, SortingState, Row } from "@tanstack/react-table"

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    copy?: boolean
    mono?: boolean
    muted?: boolean
    _data?: TData
    _value?: TValue
  }
}

// --- Access ---

export type Role = "user" | "admin"

// --- Verification ---

export type Verification = {
  email: boolean
  phone: boolean
}

// --- Activity log ---

export type LogEvent =
  | "verification.sent"
  | "user.registered"
  | "user.signed_in"

export type LogEntry = {
  id: number
  userId: string | null
  event: LogEvent
  channel: "sms" | "email" | null
  subject: string
  code: string | null
  detail?: string | null
  payload?: string | null
  status: "ok" | "failed"
  country: string | null
  userAgent: string | null
  createdAt: string
}

// --- Exports ---

export type ExportRow = {
  id: string
  kind: "download" | "copy"
  country: string | null
  blocks: number
  blockTypes: string
  bytes: number
  rating: number | null
  createdAt: string
  html?: string
}

// --- User ---

export type User = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: Role
  verification: Verification
  createdAt: string
}

// --- Forms ---

export type FormState = {
  success?: boolean
  errors?: Record<string, string[] | undefined>
  values?: Record<string, string>
}
