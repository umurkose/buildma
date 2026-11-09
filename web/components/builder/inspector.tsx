"use client"

import { useState, type ReactNode } from "react"
import dynamic from "next/dynamic"
import {
  ArrowDown,
  ArrowUp,
  Copy,
  List,
  ListOrdered,
  Mail,
  MousePointerClick,
  Plus,
  RotateCcw,
  Square,
  Trash2,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  AlignField,
  ColorField,
  Field,
  FontField,
  Row,
  Section,
  Segmented,
  SliderField,
  SwitchRow,
  WeightField,
} from "@/components/builder/fields"
import {
  blockSpacing,
  COLUMN_TYPES,
  columnImageMax,
  EMAIL_WIDTH,
  makeColumnChild,
  META,
  PLACEHOLDERS,
  useBuilder,
  type Block,
  type BlockType,
} from "@/components/builder/store"

// Lazily, because tiptap/ProseMirror is a 466KB chunk — about a third of the editor's
// initial JavaScript — for a field that only exists when a Rich Text block is
// selected. `ssr: false` because the editor is a browser surface either way.
const RichTextField = dynamic(
  () => import("@/components/builder/rich-text").then((m) => m.RichTextField),
  { ssr: false, loading: () => <Skeleton className="h-28 w-full rounded-lg" /> },
)

type Tab = "block" | "email"

/**
 * The right-hand panel: the selected block, or the email as a whole. `inSheet`
 * leaves room at the end of the tab row for the sheet's own close button.
 */
export function InspectorPanel({ inSheet = false }: { inSheet?: boolean }) {
  const selectedId = useBuilder((state) => state.selectedId)
  const block = useBuilder((state) => state.blocks.find((b) => b.id === selectedId) ?? null)
  const [tab, setTab] = useState<Tab>(selectedId ? "block" : "email")

  // Selecting a block jumps to it; deselecting goes back to the email.
  const [prevSelected, setPrevSelected] = useState(selectedId)
  if (selectedId !== prevSelected) {
    setPrevSelected(selectedId)
    setTab(selectedId ? "block" : "email")
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as Tab)}
      className="flex min-h-0 flex-1 flex-col gap-0"
    >
      <div className={cn("flex h-12 shrink-0 items-center border-b border-border px-3", inSheet && "pr-12")}>
        <TabsList className="w-full">
          <TabsTrigger value="block">
            <Square />
            Block
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail />
            Email
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Bottom room so the last controls can scroll clear of the floating display button. */}
      <TabsContent value="block" className="min-h-0 flex-1 overflow-y-auto pb-20">
        {block ? (
          <BlockInspector key={block.id} block={block} />
        ) : (
          <NothingSelected onEmail={() => setTab("email")} />
        )}
      </TabsContent>
      <TabsContent value="email" className="min-h-0 flex-1 overflow-y-auto pb-20">
        <EmailInspector />
      </TabsContent>
    </Tabs>
  )
}

function NothingSelected({ onEmail }: { onEmail: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span className="mb-1 flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <MousePointerClick className="size-5" />
      </span>
      <p className="text-sm font-medium">No block selected</p>
      <p className="text-xs text-pretty text-muted-foreground">
        Click a block on the canvas to edit it, or change the email as a whole.
      </p>
      <Button variant="outline" size="sm" className="mt-2" onClick={onEmail}>
        <Mail data-icon="inline-start" />
        Email settings
      </Button>
    </div>
  )
}

function HeaderAction({
  label,
  disabled,
  destructive,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  destructive?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className={cn(destructive && "hover:bg-destructive/10 hover:text-destructive")}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

const TEXT_TYPES: BlockType[] = ["heading", "text", "richtext"]
const TYPOGRAPHY: BlockType[] = [...TEXT_TYPES, "list", "quote", "callout", "table", "button", "menu"]
const WEIGHTED: BlockType[] = ["heading", "text", "button", "menu", "table"]
const LEADING: BlockType[] = ["text", "richtext", "list", "quote", "callout"]

function BlockInspector({ block }: { block: Block }) {
  const update = useBuilder((state) => state.update)
  const reset = useBuilder((state) => state.reset)
  const remove = useBuilder((state) => state.remove)
  const duplicate = useBuilder((state) => state.duplicate)
  const move = useBuilder((state) => state.move)
  const index = useBuilder((state) => state.blocks.findIndex((b) => b.id === block.id))
  const count = useBuilder((state) => state.blocks.length)
  const doc = useBuilder((state) => state.doc)

  const set = (patch: Partial<Block>, tag?: string | null) => update(block.id, patch, tag)
  const type = block.type
  const meta = META[type]
  const TypeIcon = meta.icon
  const isText = TEXT_TYPES.includes(type)
  const imageMax = EMAIL_WIDTH - blockSpacing(block, doc).x * 2
  const hasAlign = !["divider", "columns", "spacer"].includes(type)
  const hasLayout =
    hasAlign || ["button", "callout", "list", "table", "image", "divider", "spacer"].includes(type)

  return (
    <div className="flex flex-col pb-2">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/80">
          <TypeIcon className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{meta.label}</p>
          <p className="truncate text-xs text-muted-foreground">{meta.desc}</p>
        </div>
        <div className="-mr-1.5 flex shrink-0 items-center">
          <HeaderAction label="Move up" disabled={index <= 0} onClick={() => move(block.id, -1)}>
            <ArrowUp />
          </HeaderAction>
          <HeaderAction
            label="Move down"
            disabled={index === -1 || index >= count - 1}
            onClick={() => move(block.id, 1)}
          >
            <ArrowDown />
          </HeaderAction>
          <HeaderAction label="Duplicate  ⌘D" onClick={() => duplicate(block.id)}>
            <Copy />
          </HeaderAction>
          <HeaderAction label="Delete  ⌫" destructive onClick={() => remove(block.id)}>
            <Trash2 />
          </HeaderAction>
        </div>
      </header>

      <div className="flex flex-col [&>section:first-child]:border-t-0">
        <ContentSection block={block} set={set} />

        {type !== "spacer" && type !== "image" && type !== "columns" && type !== "social" && (
          <Section title="Colours">
            {(isText || type === "callout") && (
              <>
                <ColorField label="Text" value={block.color} onChange={(color) => set({ color })} />
                <ColorField
                  label="Background"
                  value={block.background}
                  allowNone={isText}
                  onChange={(background) => set({ background })}
                />
              </>
            )}
            {type === "button" && (
              <>
                <ColorField label="Label" value={block.color} onChange={(color) => set({ color })} />
                <ColorField
                  label="Button"
                  value={block.background}
                  onChange={(background) => set({ background })}
                />
              </>
            )}
            {(type === "list" || type === "menu" || type === "table") && (
              <ColorField label="Text" value={block.color} onChange={(color) => set({ color })} />
            )}
            {type === "divider" && (
              <ColorField label="Line" value={block.color} onChange={(color) => set({ color })} />
            )}
            {type === "quote" && (
              <>
                <ColorField label="Text" value={block.color} onChange={(color) => set({ color })} />
                <ColorField
                  label="Author"
                  value={block.authorColor}
                  onChange={(authorColor) => set({ authorColor })}
                />
                <ColorField
                  label="Accent bar"
                  value={block.background}
                  onChange={(background) => set({ background })}
                />
              </>
            )}
          </Section>
        )}

        {TYPOGRAPHY.includes(type) && (
          <Section title="Typography">
            <FontField value={block.fontFamily} doc={doc} onChange={(fontFamily) => set({ fontFamily })} />
            <SliderField
              label="Size"
              value={block.fontSize}
              min={10}
              max={64}
              step={1}
              suffix="px"
              onChange={(fontSize) => set({ fontSize })}
            />
            {WEIGHTED.includes(type) && (
              <WeightField value={block.fontWeight} onChange={(fontWeight) => set({ fontWeight })} />
            )}
            {LEADING.includes(type) && (
              <SliderField
                label="Line height"
                value={block.lineHeight}
                min={1}
                max={2.4}
                step={0.1}
                format={(v) => v.toFixed(1)}
                onChange={(lineHeight) => set({ lineHeight })}
              />
            )}
          </Section>
        )}

        {hasLayout && (
          <Section title="Layout">
            {hasAlign && <AlignField value={block.align} onChange={(align) => set({ align })} />}
            {type === "button" && (
              <>
                <Row label="Width">
                  <div className="w-36">
                    <Segmented
                      label="Button width"
                      value={block.fullWidth ? "full" : "auto"}
                      options={[
                        { value: "auto", label: "Auto" },
                        { value: "full", label: "Full" },
                      ]}
                      onChange={(value) => set({ fullWidth: value === "full" })}
                    />
                  </div>
                </Row>
                <SliderField
                  label="Corner radius"
                  value={block.radius}
                  min={0}
                  max={28}
                  step={1}
                  suffix="px"
                  onChange={(radius) => set({ radius })}
                />
              </>
            )}
            {type === "callout" && (
              <SliderField
                label="Corner radius"
                value={block.radius}
                min={0}
                max={28}
                step={1}
                suffix="px"
                onChange={(radius) => set({ radius })}
              />
            )}
            {type === "list" && (
              <Row label="Style">
                <div className="w-36">
                  <Segmented
                    label="List style"
                    value={block.listStyle}
                    options={[
                      { value: "bulleted", label: "Bulleted", icon: List },
                      { value: "numbered", label: "Numbered", icon: ListOrdered },
                      { value: "none", label: "Plain", icon: X },
                    ]}
                    onChange={(listStyle) => set({ listStyle })}
                  />
                </div>
              </Row>
            )}
            {type === "table" && (
              <>
                <SwitchRow
                  id={`header-${block.id}`}
                  label="Header row"
                  checked={block.headerRow}
                  onChange={(headerRow) => set({ headerRow })}
                />
                <SwitchRow
                  id={`borders-${block.id}`}
                  label="Cell borders"
                  checked={block.borders}
                  onChange={(borders) => set({ borders })}
                />
              </>
            )}
            {type === "image" && (
              <SliderField
                label="Width"
                value={Math.min(block.width, imageMax)}
                min={80}
                max={imageMax}
                step={1}
                suffix="px"
                onChange={(width) => set({ width })}
              />
            )}
            {type === "divider" && (
              <SliderField
                label="Thickness"
                value={block.thickness}
                min={1}
                max={8}
                step={1}
                suffix="px"
                onChange={(thickness) => set({ thickness })}
              />
            )}
            {type === "spacer" && (
              <SliderField
                label="Height"
                value={block.height}
                min={8}
                max={160}
                step={2}
                suffix="px"
                onChange={(height) => set({ height })}
              />
            )}
          </Section>
        )}

        {type !== "spacer" && (
          <Section title="Spacing">
            <SpacingFields block={block} set={set} />
          </Section>
        )}
      </div>

      <div className="px-4 pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => reset(block.id)}
        >
          <RotateCcw data-icon="inline-start" />
          Reset style
        </Button>
      </div>
    </div>
  )
}

function ContentSection({
  block,
  set,
}: {
  block: Block
  set: (patch: Partial<Block>, tag?: string | null) => void
}) {
  switch (block.type) {
    case "heading":
    case "text":
      return (
        <Section title="Content">
          <Textarea
            aria-label="Text"
            value={block.text}
            onChange={(e) => set({ text: e.target.value })}
            rows={block.type === "heading" ? 2 : 4}
            placeholder={PLACEHOLDERS[block.type]}
          />
        </Section>
      )
    case "richtext":
      return (
        <Section title="Content">
          <RichTextField key={block.id} value={block.html} onChange={(html) => set({ html })} />
        </Section>
      )
    case "button":
      return (
        <Section title="Content">
          <Field label="Label">
            <Input value={block.text} onChange={(e) => set({ text: e.target.value })} placeholder={PLACEHOLDERS.button} />
          </Field>
          <Field label="Link">
            <Input type="url" value={block.href} onChange={(e) => set({ href: e.target.value })} placeholder="https://…" />
          </Field>
        </Section>
      )
    case "image":
      return (
        <Section title="Content">
          <Field label="Image URL" hint="Host the file anywhere public — your site, a CDN.">
            <Input type="url" value={block.src} onChange={(e) => set({ src: e.target.value })} placeholder="https://…/photo.png" />
          </Field>
          <Field label="Alt text" hint="Shown where images are blocked, and read aloud.">
            <Input value={block.alt} onChange={(e) => set({ alt: e.target.value })} placeholder="Describe the image" />
          </Field>
          <Field label="Link (optional)">
            <Input type="url" value={block.href} onChange={(e) => set({ href: e.target.value })} placeholder="https://…" />
          </Field>
        </Section>
      )
    case "list":
      return (
        <Section title="Content">
          <Field label="Items" hint="One item per line.">
            <Textarea value={block.text} onChange={(e) => set({ text: e.target.value })} rows={5} placeholder={PLACEHOLDERS.list} />
          </Field>
        </Section>
      )
    case "table":
      return (
        <Section title="Content">
          <TableEditor value={block.text} onChange={(text) => set({ text })} />
        </Section>
      )
    case "quote":
      return (
        <Section title="Content">
          <Field label="Quote">
            <Textarea value={block.text} onChange={(e) => set({ text: e.target.value })} rows={3} placeholder={PLACEHOLDERS.quote} />
          </Field>
          <Field label="Author">
            <Input value={block.author} onChange={(e) => set({ author: e.target.value })} placeholder="Optional" />
          </Field>
        </Section>
      )
    case "callout":
      return (
        <Section title="Content">
          <Textarea aria-label="Text" value={block.text} onChange={(e) => set({ text: e.target.value })} rows={3} placeholder={PLACEHOLDERS.callout} />
        </Section>
      )
    case "menu":
      return (
        <Section title="Links">
          <LinkRowsField value={block.text} onChange={(text) => set({ text })} labelPlaceholder="Label" addLabel="Add link" />
        </Section>
      )
    case "social":
      return (
        <Section title="Profiles">
          <LinkRowsField value={block.text} onChange={(text) => set({ text })} labelPlaceholder="network" addLabel="Add profile" />
          <p className="text-[11px] leading-snug text-muted-foreground">
            Known networks: x, instagram, facebook, linkedin, youtube, tiktok, github, email,
            website.
          </p>
        </Section>
      )
    case "columns":
      return <ColumnsFields block={block} set={set} />
    default:
      return null
  }
}

function ColumnsFields({
  block,
  set,
}: {
  block: Block
  set: (patch: Partial<Block>, tag?: string | null) => void
}) {
  const doc = useBuilder((state) => state.doc)
  const children = block.children
  const recap = (kids: Block[]): Block[] => {
    const max = columnImageMax(block, doc, kids.length)
    return kids.map((child) => (child.type === "image" ? { ...child, width: Math.min(child.width, max) } : child))
  }
  const setChild = (index: number, patch: Partial<Block>) =>
    set(
      { children: children.map((child, i) => (i === index ? { ...child, ...patch } : child)) },
      `update:${block.id}:child:${children[index].id}:${Object.keys(patch).sort().join(",")}`,
    )
  const setType = (index: number, type: BlockType) => {
    const fresh = makeColumnChild(type)
    const sized = type === "image" ? { ...fresh, width: columnImageMax(block, doc) } : fresh
    set({ children: children.map((child, i) => (i === index ? sized : child)) }, null)
  }
  const addColumn = () => set({ children: recap([...children, makeColumnChild("text")]) }, null)
  const removeColumn = (index: number) => set({ children: recap(children.filter((_, i) => i !== index)) }, null)
  const imgMax = columnImageMax(block, doc)

  return (
    <Section
      title={`Columns · ${children.length}`}
      action={
        children.length < 3 ? (
          <Button variant="ghost" size="xs" onClick={addColumn}>
            <Plus data-icon="inline-start" />
            Add
          </Button>
        ) : null
      }
    >
      {children.map((child, index) => (
        <div key={child.id} className="flex flex-col gap-3 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">Column {index + 1}</span>
            <div className="flex items-center gap-1">
              <NativeSelect
                aria-label={`Column ${index + 1} type`}
                size="sm"
                className="w-28"
                value={child.type}
                onChange={(e) => setType(index, e.target.value as BlockType)}
              >
                {COLUMN_TYPES.map((type) => (
                  <NativeSelectOption key={type} value={type}>
                    {META[type].label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {children.length > 1 && (
                <button
                  type="button"
                  aria-label={`Remove column ${index + 1}`}
                  onClick={() => removeColumn(index)}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
          <ColumnChildFields child={child} imgMax={imgMax} onChange={(patch) => setChild(index, patch)} />
          <AlignField value={child.align} onChange={(align) => setChild(index, { align })} />
        </div>
      ))}
    </Section>
  )
}

function ColumnChildFields({
  child,
  imgMax,
  onChange,
}: {
  child: Block
  imgMax: number
  onChange: (patch: Partial<Block>) => void
}) {
  switch (child.type) {
    case "heading":
      return (
        <>
          <Input aria-label="Heading" value={child.text} onChange={(e) => onChange({ text: e.target.value })} placeholder={PLACEHOLDERS.heading} />
          <ColorField label="Colour" value={child.color} onChange={(color) => onChange({ color })} />
          <SliderField label="Size" value={child.fontSize} min={12} max={40} step={1} suffix="px" onChange={(fontSize) => onChange({ fontSize })} />
        </>
      )
    case "image":
      return (
        <>
          <Input type="url" aria-label="Image URL" value={child.src} onChange={(e) => onChange({ src: e.target.value })} placeholder="Image URL — https://…" />
          <Input aria-label="Alt text" value={child.alt} onChange={(e) => onChange({ alt: e.target.value })} placeholder="Alt text" />
          <Input type="url" aria-label="Link" value={child.href} onChange={(e) => onChange({ href: e.target.value })} placeholder="Link (optional)" />
          <SliderField label="Width" value={Math.min(child.width, imgMax)} min={40} max={imgMax} step={1} suffix="px" onChange={(width) => onChange({ width })} />
        </>
      )
    case "button":
      return (
        <>
          <Input aria-label="Label" value={child.text} onChange={(e) => onChange({ text: e.target.value })} placeholder={PLACEHOLDERS.button} />
          <Input type="url" aria-label="Link" value={child.href} onChange={(e) => onChange({ href: e.target.value })} placeholder="Link — https://…" />
          <ColorField label="Label" value={child.color} onChange={(color) => onChange({ color })} />
          <ColorField label="Button" value={child.background} onChange={(background) => onChange({ background })} />
        </>
      )
    case "text":
    default:
      return (
        <>
          <Textarea aria-label="Text" value={child.text} onChange={(e) => onChange({ text: e.target.value })} rows={3} placeholder={PLACEHOLDERS.text} />
          <ColorField label="Colour" value={child.color} onChange={(color) => onChange({ color })} />
          <SliderField label="Size" value={child.fontSize} min={12} max={40} step={1} suffix="px" onChange={(fontSize) => onChange({ fontSize })} />
        </>
      )
  }
}

function EmailInspector() {
  const doc = useBuilder((state) => state.doc)
  const updateDoc = useBuilder((state) => state.updateDoc)
  const adapt = doc.darkMode !== "fixed"

  return (
    <div className="flex flex-col pb-2 [&>section:first-child]:border-t-0">
      <Section title="Inbox">
        <Field label="Title" hint="The email's title — also its subject in the preview.">
          <Input value={doc.title} onChange={(e) => updateDoc({ title: e.target.value })} placeholder="Launch day is here" />
        </Field>
        <Field label="Preview text" hint="The line inboxes show after the subject.">
          <Textarea value={doc.description} onChange={(e) => updateDoc({ description: e.target.value })} rows={2} placeholder="A short summary of the email" />
        </Field>
      </Section>

      <Section title="Colours">
        <ColorField label="Backdrop" value={doc.background} onChange={(background) => updateDoc({ background })} />
        <ColorField label="Email" value={doc.contentBackground} onChange={(contentBackground) => updateDoc({ contentBackground })} />
      </Section>

      <Section title="Typography">
        <FontField
          value={doc.fontFamily}
          doc={doc}
          inheritable={false}
          onChange={(fontFamily) => updateDoc({ fontFamily: fontFamily ?? "system" })}
        />
      </Section>

      <Section title="Spacing">
        <SliderField label="Horizontal" value={doc.spacingX} min={0} max={64} step={2} suffix="px" onChange={(spacingX) => updateDoc({ spacingX })} />
        <SliderField label="Vertical" value={doc.spacingY} min={0} max={64} step={2} suffix="px" onChange={(spacingY) => updateDoc({ spacingY })} />
      </Section>

      <Section title="Dark mode">
        <Segmented
          label="Dark mode"
          value={adapt ? "adapt" : "fixed"}
          options={[
            { value: "adapt", label: "Adapt" },
            { value: "fixed", label: "Keep colours" },
          ]}
          onChange={(darkMode) => updateDoc({ darkMode })}
        />
        <p className="text-[11px] leading-snug text-pretty text-muted-foreground">
          {adapt
            ? "Readers in dark mode get matching dark colours; brand colours stay as they are. Switch the editor to dark to see them."
            : "Colours stay exactly as designed, even in a dark inbox."}
        </p>
      </Section>
    </div>
  )
}

function SpacingFields({
  block,
  set,
}: {
  block: Block
  set: (patch: Partial<Block>, tag?: string | null) => void
}) {
  const doc = useBuilder((state) => state.doc)
  const { x, y } = blockSpacing(block, doc)
  const linked = block.spacingX === null && block.spacingY === null

  return (
    <>
      <SwitchRow
        id={`spacing-${block.id}`}
        label="Match email"
        checked={linked}
        onChange={(on) => set(on ? { spacingX: null, spacingY: null } : { spacingX: x, spacingY: y }, null)}
      />
      <SliderField label="Horizontal" value={x} min={0} max={64} step={2} suffix="px" disabled={linked} onChange={(spacingX) => set({ spacingX })} />
      <SliderField label="Vertical" value={y} min={0} max={64} step={2} suffix="px" disabled={linked} onChange={(spacingY) => set({ spacingY })} />
    </>
  )
}

function LinkRowsField({
  value,
  onChange,
  labelPlaceholder,
  addLabel,
}: {
  value: string
  onChange: (value: string) => void
  labelPlaceholder: string
  addLabel: string
}) {
  const rows = (value.length ? value.split("\n") : [""]).map((line) => {
    const [label, url] = line.split("|")
    return { label: (label ?? "").trim(), url: (url ?? "").trim() }
  })
  const serialize = (rs: { label: string; url: string }[]) =>
    rs.map((r) => (r.url ? `${r.label} | ${r.url}` : r.label)).join("\n")
  const setRow = (i: number, patch: Partial<{ label: string; url: string }>) =>
    onChange(serialize(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r))))

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Input
            aria-label={`Row ${i + 1} label`}
            className="w-0 flex-1"
            value={row.label}
            onChange={(e) => setRow(i, { label: e.target.value })}
            placeholder={labelPlaceholder}
          />
          <Input
            aria-label={`Row ${i + 1} link`}
            type="url"
            className="w-0 flex-[1.4]"
            value={row.url}
            onChange={(e) => setRow(i, { url: e.target.value })}
            placeholder="https://…"
          />
          <button
            type="button"
            aria-label={`Remove row ${i + 1}`}
            disabled={rows.length <= 1}
            onClick={() => onChange(serialize(rows.filter((_, idx) => idx !== i)))}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => onChange(serialize([...rows, { label: "", url: "" }]))}
      >
        <Plus data-icon="inline-start" />
        {addLabel}
      </Button>
    </div>
  )
}

function TableEditor({ value, onChange }: { value: string; onChange: (text: string) => void }) {
  const parsed = value.trim() ? value.split(/\r?\n/).map((row) => row.split(" | ")) : [["", ""]]
  const cols = Math.max(1, ...parsed.map((row) => row.length))
  const rows = parsed.map((row) => {
    const cells = [...row]
    while (cells.length < cols) cells.push("")
    return cells
  })

  const commit = (next: string[][]) => onChange(next.map((row) => row.join(" | ")).join("\n"))
  const setCell = (ri: number, ci: number, v: string) => {
    const next = rows.map((row) => [...row])
    // A typed " | " would split the cell in two on the next parse.
    next[ri][ci] = v.replace(/\s\|\s/g, " / ")
    commit(next)
  }
  const addRow = () => commit([...rows, Array<string>(cols).fill("")])
  const addCol = () => commit(rows.map((row) => [...row, ""]))
  const removeRow = (ri: number) => {
    if (rows.length > 1) commit(rows.filter((_, i) => i !== ri))
  }
  const removeCol = (ci: number) => {
    if (cols > 1) commit(rows.map((row) => row.filter((_, i) => i !== ci)))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/40">
              {rows[0].map((_, ci) => (
                <th key={ci} className="border-r border-b border-border p-0 font-normal">
                  <button
                    type="button"
                    onClick={() => removeCol(ci)}
                    disabled={cols <= 1}
                    aria-label={`Remove column ${ci + 1}`}
                    className="flex h-6 w-full items-center justify-center text-muted-foreground/60 transition hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
                  >
                    <X className="size-3" />
                  </button>
                </th>
              ))}
              <th className="w-8 border-b border-border p-0">
                <button
                  type="button"
                  onClick={addCol}
                  aria-label="Add column"
                  className="flex h-6 w-full items-center justify-center text-muted-foreground transition hover:text-primary"
                >
                  <Plus className="size-3.5" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className="border-r border-b border-border p-0">
                    <input
                      aria-label={`Row ${ri + 1}, column ${ci + 1}`}
                      value={cell}
                      onChange={(event) => setCell(ri, ci, event.target.value)}
                      placeholder="…"
                      className={cn(
                        "w-full min-w-20 bg-transparent px-2.5 py-2 outline-none focus:bg-primary/5",
                        ri === 0 && "font-medium",
                      )}
                    />
                  </td>
                ))}
                <td className="w-8 border-b border-border p-0">
                  <button
                    type="button"
                    onClick={() => removeRow(ri)}
                    disabled={rows.length <= 1}
                    aria-label={`Remove row ${ri + 1}`}
                    className="flex size-8 items-center justify-center text-muted-foreground/60 transition hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
                  >
                    <X className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" size="sm" className="w-full" onClick={addRow}>
        <Plus data-icon="inline-start" />
        Add row
      </Button>
    </div>
  )
}
