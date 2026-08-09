"use client"

import { useState, type ReactNode } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Icon } from "@/components/ui/icon"
import { fetch, mutate, useInvalidate, useMutate } from "@/core/client"
import { useForm } from "@/core/client"
import { formatDate } from "@/lib/format"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardHint,
} from "@/components/ui/card"
import { Input, PhoneInput } from "@/components/ui/input"
import { Loading, Spinner } from "@/components/ui/spinner"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { alert } from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/sonner"
import { flagSrc, splitPhone } from "@/lib/countries"
import { Copy } from "@/components/ui/copy"
import { Row } from "@/components/ui/row"
import { LogsTable } from "../../logs/table"
import type { User, LogEntry } from "@/types"

function Country({ phone }: { phone: string | null }) {
  const [country] = phone ? splitPhone(phone) : [undefined]
  if (!country) return null
  return (
    <Row label="Country">
      <span className="inline-flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={flagSrc(country.code)}
          alt=""
          className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover"
        />
        {country.name}
      </span>
    </Row>
  )
}

export function Detail({ id, currentUserId }: { id: string; currentUserId: string }) {
  const router = useRouter()
  const invalidate = useInvalidate()
  const base = `/admin/users/${id}`

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const param = searchParams.get("tab")
  const tab = param === "logs" ? param : "account"
  const setTab = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "account") params.delete("tab")
    else params.set("tab", value)
    const qs = params.toString()
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname)
  }

  const userQ = fetch(base, { staleTime: 0 })

  const logsQ = fetch(`${base}/logs`, { staleTime: 0 })

  const user = userQ.data as User | undefined
  const logs = (logsQ.data as LogEntry[] | undefined) ?? []

  function refresh() {
    invalidate(base, `${base}/logs`)
    router.refresh()
  }

  function afterDelete() {
    router.push("/app/users", { scroll: false })
    router.refresh()
  }

  if (userQ.isLoading) return <Loading />
  if (!user) return <p className="p-4 text-sm text-muted-foreground">User not found.</p>

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Identity user={user} />

      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
        <div className="shrink-0 border-b border-border p-4">
          <TabsList className="w-full">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="account" className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <ProfileCard user={user} onSaved={refresh} />
          <RecordCard user={user} />
          <VerificationCard user={user} onChanged={refresh} />
          {user.id !== currentUserId && (
            <DangerCard id={id} name={user.name} onDeleted={afterDelete} />
          )}
        </TabsContent>

        <TabsContent value="logs" className="min-h-0 flex-1 overflow-y-auto p-4">
          <LogsTable logs={logs} onRefresh={() => invalidate(`${base}/logs`)} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// --- Identity ---

function Identity({ user }: { user: User }) {
  const title = user.email || user.phone || "No contact"
  const contact = user.email ? user.phone : null

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-border p-4">
      <Avatar size="lg">
        <AvatarFallback className="text-base font-medium">
          {title.trim().charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <h2 className="truncate font-medium">{title}</h2>
        {contact && <p className="truncate text-sm text-muted-foreground">{contact}</p>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <Mark on={user.verification.email} label="Email" />
          <Mark on={user.verification.phone} label="Phone" />
        </div>
      </div>
    </div>
  )
}

function Mark({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        on ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon name={on ? "Check" : "Circle"} className="size-3" />
      {label}
    </span>
  )
}

// --- Shared pieces ---

function Action({
  hint,
  error,
  pending,
  disabled,
  onClick,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { hint: string; error?: string; pending: boolean }) {
  return (
    <CardFooter>
      <CardHint className={cn(error && "text-destructive")}>{error ?? hint}</CardHint>
      <Button size="sm" disabled={pending || disabled} onClick={onClick} {...props}>
        {pending && <Spinner />}
        {children}
      </Button>
    </CardFooter>
  )
}

function Verified() {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
      <Icon name="Check" className="size-4" />
      Verified
    </span>
  )
}

// --- Account ---

function ProfileCard({ user, onSaved }: { user: User; onSaved: () => void }) {
  const f = useForm({
    name: user.name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    role: user.role,
  })
  const [editing, setEditing] = useState<string | null>(null)

  const save = useMutate(() => {
    toast.success("Profile saved")
    setEditing(null)
    onSaved()
  })

  const submit = () => {
    const body: Record<string, unknown> = {}
    if (f.values.name && f.values.name !== (user.name ?? "")) body.name = f.values.name
    if (f.values.email && f.values.email !== (user.email ?? "")) body.email = f.values.email
    if (f.values.phone !== (user.phone ?? "")) body.phone = f.values.phone || null
    if (f.values.role !== user.role) body.role = f.values.role

    return save.run(() =>
      mutate(`/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify(body) }),
    )
  }

  const cancel = () => {
    f.reset()
    setEditing(null)
  }

  const edit = (key: string) => ({
    editing: editing === key,
    onEdit: () => {
      f.reset()
      setEditing(key)
    },
    onCancel: cancel,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <EditRow label="Name" value={user.name} {...edit("name")}>
          <Input
            autoFocus
            placeholder="Full name"
            value={f.values.name}
            onChange={(e) => f.set({ name: e.target.value })}
          />
        </EditRow>

        <EditRow
          label="Email"
          value={user.email && <Copy value={user.email}>{user.email}</Copy>}
          {...edit("email")}
        >
          <Input
            autoFocus
            type="email"
            placeholder="name@example.com"
            value={f.values.email}
            onChange={(e) => f.set({ email: e.target.value })}
          />
        </EditRow>

        <EditRow
          label="Phone"
          value={user.phone && <Copy value={user.phone}>{user.phone}</Copy>}
          {...edit("phone")}
        >
          <PhoneInput value={f.values.phone} onChange={(phone) => f.set({ phone })} />
        </EditRow>

        <Country phone={user.phone} />

        <EditRow label="Role" value={user.role === "admin" ? "Admin" : "User"} {...edit("role")}>
          <NativeSelect
            className="w-full"
            value={f.values.role}
            onChange={(e) => f.set({ role: e.target.value as User["role"] })}
          >
            <NativeSelectOption value="user">User</NativeSelectOption>
            <NativeSelectOption value="admin">Admin</NativeSelectOption>
          </NativeSelect>
        </EditRow>
      </CardContent>

      {(editing !== null || f.dirty) && (
        <Action
          hint="Applies immediately."
          error={save.error}
          pending={save.pending}
          disabled={!f.dirty}
          onClick={submit}
        >
          Save
        </Action>
      )}
    </Card>
  )
}

function RecordCard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Record</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Row label="User ID">
          <Copy value={user.id} className="font-mono">
            {user.id}
          </Copy>
        </Row>
        <Row label="Joined">{formatDate(user.createdAt)}</Row>
      </CardContent>
    </Card>
  )
}

function EditRow({
  label,
  value,
  editing,
  onEdit,
  onCancel,
  children,
}: {
  label: string
  value: ReactNode
  editing: boolean
  onEdit: () => void
  onCancel: () => void
  children: ReactNode
}) {
  return (
    <Row
      label={label}
      action={
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-primary"
          onClick={editing ? onCancel : onEdit}
        >
          <Icon name={editing ? "X" : "Pencil"} />
          <span className="sr-only">{editing ? `Stop editing ${label}` : `Edit ${label}`}</span>
        </Button>
      }
    >
      {editing ? children : value}
    </Row>
  )
}

function VerificationCard({
  user,
  onChanged,
}: {
  user: User
  onChanged: () => void
}) {
  const act = useMutate(() => {
    toast.success("Verification updated")
    onChanged()
  })
  const patch = (body: object) =>
    act.run(() =>
      mutate(`/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify(body) }),
    )

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Row
            label="Email"
            action={
              user.verification.email ? (
                <Verified />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={act.pending || !user.email}
                  onClick={() => patch({ emailVerified: true })}
                >
                  Verify
                </Button>
              )
            }
          >
            {user.email && <Copy value={user.email}>{user.email}</Copy>}
          </Row>

          <Row
            label="Phone"
            action={
              user.verification.phone ? (
                <Verified />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={act.pending || !user.phone}
                  onClick={() => patch({ phoneVerified: true })}
                >
                  Verify
                </Button>
              )
            }
          >
            {user.phone && <Copy value={user.phone}>{user.phone}</Copy>}
          </Row>
        </CardContent>
        {act.error && (
          <CardFooter>
            <CardHint className="text-destructive">{act.error}</CardHint>
          </CardFooter>
        )}
      </Card>
    </>
  )
}

function DangerCard({
  id,
  name,
  onDeleted,
}: {
  id: string
  name: string | null
  onDeleted: () => void
}) {
  const del = useMutate(() => {
    toast.success("User deleted")
    onDeleted()
  })

  const remove = async () => {
    const ok = await alert({
      title: `Delete ${name || "this user"}?`,
      description: "This permanently removes the account. This action can't be undone.",
      action: "Delete",
    })
    if (ok) del.run(() => mutate(`/admin/users/${id}`, { method: "DELETE" }))
  }

  return (
    <Card variant="destructive">
      <CardHeader>
        <CardTitle>Delete user</CardTitle>
        <CardDescription>The account, permanently.</CardDescription>
      </CardHeader>
      <CardFooter>
        <CardHint className={cn(del.error && "text-destructive")}>
          {del.error ?? "This can't be undone."}
        </CardHint>
        <Button variant="destructive" size="sm" disabled={del.pending} onClick={remove}>
          {del.pending ? <Spinner /> : <Icon name="Trash2" />}
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
