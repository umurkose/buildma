"use client"

import { useMemo, useState } from "react"
import { useTheme } from "next-themes"
import { Monitor, Moon, Smartphone, Sun, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Segmented } from "@/components/builder/fields"
import { renderEmailHtml } from "@/components/builder/export"
import { useBuilder } from "@/components/builder/store"

// The email as it lands in an inbox: the message header — subject and sender — over
// the exported HTML itself (the real file, not a re-render), at desktop or phone
// width, in a light or a dark inbox.

type Scheme = "light" | "dark"
type Device = "desktop" | "mobile"

// The inbox's own colours, independent of the app's theme: the preview can show a
// dark inbox while the editor is light, and the other way round.
const MAIL: Record<Scheme, { surface: string; text: string; muted: string; chip: string; divider: string }> = {
  light: {
    surface: "bg-white",
    text: "text-neutral-900",
    muted: "text-neutral-500",
    chip: "bg-neutral-100 text-neutral-600",
    divider: "border-neutral-200",
  },
  dark: {
    surface: "bg-neutral-900",
    text: "text-neutral-100",
    muted: "text-neutral-400",
    chip: "bg-neutral-800 text-neutral-300",
    divider: "border-neutral-800",
  },
}

const SENDER = { name: "Your Company", address: "hello@yourcompany.com", initial: "Y" }

/**
 * Pin the email's dark-mode rules on or off for this preview, whatever the
 * browser's own preference is: the toggle decides, so what you pick is what you see.
 */
function forScheme(html: string, scheme: Scheme): string {
  return html.replace(
    "@media (prefers-color-scheme:dark){",
    scheme === "dark" ? "@media all{" : "@media not all{",
  )
}

export function InboxPreview({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const blocks = useBuilder((state) => state.blocks)
  const doc = useBuilder((state) => state.doc)
  const { resolvedTheme } = useTheme()
  const [device, setDevice] = useState<Device>("desktop")
  const [scheme, setScheme] = useState<Scheme>("light")

  // Every time it opens, start from the app's own theme.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setScheme(resolvedTheme === "dark" ? "dark" : "light")
  }

  const html = useMemo(
    () => (open ? forScheme(renderEmailHtml(blocks, doc), scheme) : ""),
    [open, blocks, doc, scheme],
  )
  const subject = doc.title.trim() || "(no subject)"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="flex h-[calc(100svh-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(80rem,calc(100vw-2rem))]"
      >
        <DialogTitle className="sr-only">Preview</DialogTitle>
        <DialogDescription className="sr-only">
          How the email looks when it lands in an inbox.
        </DialogDescription>

        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border pr-2 pl-4">
          <span className="truncate text-sm font-semibold">Preview</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-24">
              <Segmented
                label="Device"
                value={device}
                options={[
                  { value: "desktop", label: "Desktop", icon: Monitor },
                  { value: "mobile", label: "Phone", icon: Smartphone },
                ]}
                onChange={setDevice}
              />
            </div>
            <div className="w-24">
              <Segmented
                label="Inbox theme"
                value={scheme}
                options={[
                  { value: "light", label: "Light inbox", icon: Sun },
                  { value: "dark", label: "Dark inbox", icon: Moon },
                ]}
                onChange={setScheme}
              />
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Close preview" onClick={() => onOpenChange(false)}>
              <X />
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 bg-muted/50">
          {open && <MessageView html={html} subject={subject} scheme={scheme} device={device} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Avatar({ size = "size-10" }: { size?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground",
        size,
      )}
    >
      {SENDER.initial}
    </span>
  )
}

/** The exported file in a sandbox: no scripts, no navigation, nothing shared. */
function EmailFrame({ html, scheme }: { html: string; scheme: Scheme }) {
  return (
    <iframe
      title="Email"
      srcDoc={html}
      sandbox=""
      className="min-h-0 w-full flex-1 border-0"
      style={{ colorScheme: scheme }}
    />
  )
}

/** One message as an inbox shows it: subject, sender, then the email itself. */
function MessageView({
  html,
  subject,
  scheme,
  device,
}: {
  html: string
  subject: string
  scheme: Scheme
  device: Device
}) {
  const m = MAIL[scheme]
  return (
    <div className="flex h-full justify-center overflow-hidden p-4 sm:p-6">
      <div
        className={cn(
          "flex h-full w-full flex-col overflow-hidden shadow-xl ring-1 ring-black/10 dark:ring-white/10",
          device === "mobile" ? "max-w-[24.5rem] rounded-[2rem]" : "max-w-4xl rounded-2xl",
          m.surface,
          m.text,
        )}
        style={{ colorScheme: scheme }}
      >
        <div className={cn("shrink-0 border-b px-5 pt-5 pb-4", m.divider)}>
          <div className="flex items-start gap-3">
            <h2 className="min-w-0 flex-1 text-xl leading-snug text-balance">{subject}</h2>
            <span className={cn("mt-1 shrink-0 rounded-md px-1.5 py-0.5 text-xs", m.chip)}>Inbox</span>
          </div>
          <div className="mt-4 flex min-w-0 items-center gap-3">
            <Avatar />
            <p className="min-w-0 truncate text-sm">
              <span className="font-semibold">{SENDER.name}</span>{" "}
              <span className={m.muted}>&lt;{SENDER.address}&gt;</span>
            </p>
          </div>
        </div>
        <EmailFrame html={html} scheme={scheme} />
      </div>
    </div>
  )
}
