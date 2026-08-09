import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import {
  Columns2,
  Heading,
  Image,
  List,
  Megaphone,
  Menu,
  Minus,
  MousePointerClick,
  MoveVertical,
  Pilcrow,
  Quote,
  Share2,
  Table,
  Type,
  type LucideIcon,
} from "lucide-react"

export type Align = "left" | "center" | "right"
export type BlockType =
  | "heading"
  | "text"
  | "richtext"
  | "list"
  | "quote"
  | "callout"
  | "table"
  | "image"
  | "columns"
  | "button"
  | "menu"
  | "social"
  | "divider"
  | "spacer"

export type Doc = {
  background: string
  contentBackground: string
  title: string
  description: string
  fontFamily: FontKey
  spacingX: number
  spacingY: number
}

export type FontKey =
  | "system"
  | "arial"
  | "helvetica"
  | "verdana"
  | "tahoma"
  | "trebuchet"
  | "georgia"
  | "times"
  | "courier"
  | "lucida"

export const FONTS: Record<FontKey, { label: string; stack: string }> = {
  system: { label: "System", stack: "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" },
  arial: { label: "Arial", stack: "Arial, Helvetica, sans-serif" },
  helvetica: { label: "Helvetica", stack: "Helvetica, Arial, sans-serif" },
  verdana: { label: "Verdana", stack: "Verdana, Geneva, sans-serif" },
  tahoma: { label: "Tahoma", stack: "Tahoma, Verdana, sans-serif" },
  trebuchet: { label: "Trebuchet MS", stack: "'Trebuchet MS', Helvetica, sans-serif" },
  georgia: { label: "Georgia", stack: "Georgia, 'Times New Roman', serif" },
  times: { label: "Times New Roman", stack: "'Times New Roman', Times, serif" },
  courier: { label: "Courier New", stack: "'Courier New', Courier, monospace" },
  lucida: { label: "Lucida Sans", stack: "'Lucida Sans Unicode', 'Lucida Grande', Verdana, sans-serif" },
}

export const FONT_KEYS = Object.keys(FONTS) as FontKey[]

export const FONT_WEIGHTS: { value: number; label: string }[] = [
  { value: 300, label: "Light" },
  { value: 400, label: "Normal" },
  { value: 500, label: "Medium" },
  { value: 600, label: "Semibold" },
  { value: 700, label: "Bold" },
]

export type Block = {
  id: string
  type: BlockType
  text: string
  html: string
  src: string
  alt: string
  href: string
  color: string
  background: string
  fontSize: number
  fontWeight: number
  lineHeight: number
  width: number
  radius: number
  fullWidth: boolean
  thickness: number
  height: number
  align: Align
  spacingX: number | null
  spacingY: number | null
  fontFamily: FontKey | null
  listStyle: "bulleted" | "numbered" | "none"
  headerRow: boolean
  borders: boolean
  author: string
  authorColor: string
  children: Block[]
}

export function blockSpacing(block: Block, doc: Doc): { x: number; y: number } {
  return { x: block.spacingX ?? doc.spacingX, y: block.spacingY ?? doc.spacingY }
}

export function blockFont(block: Block, doc: Doc): string {
  return FONTS[block.fontFamily ?? doc.fontFamily].stack
}

export const EMAIL_WIDTH = 600
export const EMAIL_GUTTER = 24

export function parsePairs(value: string): { label: string; url: string }[] {
  return value
    .split(/\r?\n/)
    .map((line) => {
      const [label, url] = line.split("|")
      return { label: (label ?? "").trim(), url: (url ?? "").trim() }
    })
    .filter((pair) => pair.label)
}

const SOCIAL_NETWORKS: Record<string, { label: string; bg: string }> = {
  x: { label: "X", bg: "#000000" },
  twitter: { label: "X", bg: "#000000" },
  instagram: { label: "IG", bg: "#e4405f" },
  facebook: { label: "f", bg: "#1877f2" },
  linkedin: { label: "in", bg: "#0a66c2" },
  youtube: { label: "YT", bg: "#ff0000" },
  tiktok: { label: "TT", bg: "#000000" },
  github: { label: "GH", bg: "#181717" },
  dribbble: { label: "Dr", bg: "#ea4c89" },
  email: { label: "@", bg: "#6b7280" },
  website: { label: "W", bg: "#6b7280" },
}

export function socialBadge(key: string): { label: string; bg: string } {
  return SOCIAL_NETWORKS[key.toLowerCase()] ?? { label: key.slice(0, 2).toUpperCase(), bg: "#6b7280" }
}

export const META: Record<BlockType, { label: string; icon: LucideIcon; desc: string }> = {
  heading: { label: "Heading", icon: Heading, desc: "A bold title line." },
  text: { label: "Text", icon: Type, desc: "A paragraph of plain text." },
  richtext: { label: "Rich Text", icon: Pilcrow, desc: "Formatted text — bold, links, lists." },
  list: { label: "List", icon: List, desc: "A bulleted or numbered list." },
  quote: { label: "Quote", icon: Quote, desc: "A pull-quote with attribution." },
  callout: { label: "Callout", icon: Megaphone, desc: "A highlighted notice box." },
  table: { label: "Table", icon: Table, desc: "A grid of rows and cells." },
  image: { label: "Image", icon: Image, desc: "A picture loaded from a URL." },
  columns: { label: "Columns", icon: Columns2, desc: "Blocks placed side by side." },
  button: { label: "Button", icon: MousePointerClick, desc: "A tappable call-to-action." },
  menu: { label: "Menu", icon: Menu, desc: "A row of navigation links." },
  social: { label: "Social", icon: Share2, desc: "Links to your social profiles." },
  divider: { label: "Divider", icon: Minus, desc: "A horizontal separator line." },
  spacer: { label: "Spacer", icon: MoveVertical, desc: "Empty vertical space." },
}

export const PLACEHOLDERS: Record<BlockType, string> = {
  heading: "Type a heading",
  text: "Type text here",
  richtext: "Type text here",
  list: "List item",
  quote: "Type a quote",
  callout: "Type a note…",
  table: "Name | Role\nCell 1 | Cell 2",
  button: "Button text",
  image: "",
  columns: "",
  menu: "Home | https://…\nAbout | https://…\nContact | https://…",
  social: "instagram | https://…\nx | https://…\nlinkedin | https://…",
  divider: "",
  spacer: "",
}

export const PALETTE_GROUPS: { label: string; types: BlockType[] }[] = [
  { label: "Text", types: ["heading", "text", "richtext", "list", "quote", "callout"] },
  { label: "Media", types: ["image", "table"] },
  { label: "Layout", types: ["columns", "divider", "spacer"] },
  { label: "Actions", types: ["button", "menu", "social"] },
]

let seq = 0
const nextId = () => `b${++seq}`

function bumpSeq(blocks: Block[]) {
  let max = seq
  const walk = (list: Block[]) => {
    for (const block of list) {
      const n = Number(block.id.slice(1))
      if (Number.isFinite(n) && n > max) max = n
      if (block.children.length) walk(block.children)
    }
  }
  walk(blocks)
  seq = max
}

const cloneBlock = (block: Block): Block => ({
  ...block,
  id: nextId(),
  children: block.children.map(cloneBlock),
})

function makeBlock(type: BlockType): Block {
  const base: Block = {
    id: nextId(),
    type,
    text: "",
    html: "",
    src: "",
    alt: "",
    href: "",
    color: "#111827",
    background: "transparent",
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.6,
    width: EMAIL_WIDTH,
    radius: 6,
    fullWidth: false,
    thickness: 1,
    height: 24,
    align: "left",
    spacingX: null,
    spacingY: null,
    fontFamily: null,
    listStyle: "bulleted",
    headerRow: true,
    borders: true,
    author: "",
    authorColor: "#6b7280",
    children: [],
  }

  switch (type) {
    case "heading":
      return { ...base, text: "", fontSize: 28, fontWeight: 700 }
    case "text":
      return { ...base, text: "", color: "#374151" }
    case "richtext":
      return { ...base, html: "", color: "#374151" }
    case "list":
      return { ...base, text: "", color: "#6b7280" }
    case "table":
      return { ...base, text: "Name | Role\nAda Lovelace | Engineer", color: "#374151", fontSize: 14 }
    case "quote":
      return { ...base, text: "", author: "", color: "#374151", background: "#111827", fontSize: 18 }
    case "callout":
      return { ...base, text: "", background: "#f3f4f6", color: "#111827", radius: 8, fontSize: 15 }
    case "columns":
      return { ...base, children: [makeColumnChild("text"), makeColumnChild("text")] }
    case "menu":
      return { ...base, text: "", color: "#374151", fontSize: 14, fontWeight: 500, align: "center" }
    case "social":
      return {
        ...base,
        text: "instagram | https://instagram.com/\nx | https://x.com/\nlinkedin | https://linkedin.com/",
        align: "center",
      }
    case "button":
      return {
        ...base,
        text: "",
        color: "#ffffff",
        background: "#111827",
        align: "center",
        fontSize: 16,
        fontWeight: 400,
      }
    case "divider":
      return { ...base, color: "#e5e7eb", thickness: 1 }
    case "spacer":
      return { ...base, height: 32, spacingY: 0 }
    case "image":
    default:
      return { ...base, alt: "Image", align: "center" }
  }
}

export const COLUMN_TYPES: BlockType[] = ["text", "heading", "image", "button"]

export function columnContentWidth(count: number, gutter: number = EMAIL_GUTTER): number {
  const col = Math.floor((EMAIL_WIDTH - gutter * 2) / Math.max(1, count))
  return Math.max(80, col - gutter * 2)
}

export function makeColumnChild(type: BlockType): Block {
  const block = makeBlock(type)
  if (type === "image") return { ...block, width: columnContentWidth(2), align: "center" }
  return block
}

const DEFAULT_DOC: Doc = {
  background: "#f4f4f5",
  contentBackground: "#ffffff",
  title: "",
  description: "",
  fontFamily: "system",
  spacingX: EMAIL_GUTTER,
  spacingY: 12,
}

type Snapshot = { blocks: Block[]; doc: Doc }

type BuilderState = {
  blocks: Block[]
  selectedId: string | null
  doc: Doc
  past: Snapshot[]
  future: Snapshot[]
  _tag: string | null
  _time: number

  add: (type: BlockType) => void
  insert: (type: BlockType, index: number) => void
  update: (id: string, patch: Partial<Block>, tag?: string | null) => void
  reset: (id: string) => void
  duplicate: (id: string) => void
  move: (id: string, direction: -1 | 1) => void
  remove: (id: string) => void
  select: (id: string | null) => void
  reorder: (ids: string[]) => void
  updateDoc: (patch: Partial<Doc>) => void
  clear: () => void
  undo: () => void
  redo: () => void
}

const HISTORY_LIMIT = 100
const COALESCE_MS = 600

export const useBuilder = create<BuilderState>()(
  persist(
    (set, get) => {
  const commit = (mutation: Partial<BuilderState>, tag: string | null) => {
    const state = get()
    const now = Date.now()
    const coalesce = tag !== null && state._tag === tag && now - state._time < COALESCE_MS
    const past = coalesce
      ? state.past
      : [...state.past, { blocks: state.blocks, doc: state.doc }].slice(-HISTORY_LIMIT)
    set({ ...mutation, past, future: [], _tag: tag, _time: now })
  }

  return {
    blocks: [],
    selectedId: null,
    doc: DEFAULT_DOC,
    past: [],
    future: [],
    _tag: null,
    _time: 0,

    insert: (type, index) => {
      const block = makeBlock(type)
      const blocks = [...get().blocks]
      blocks.splice(Math.max(0, Math.min(index, blocks.length)), 0, block)
      commit({ blocks, selectedId: block.id }, null)
    },

    add: (type) => {
      const block = makeBlock(type)
      commit({ blocks: [...get().blocks, block], selectedId: block.id }, null)
    },

    update: (id, patch, tag) =>
      commit(
        { blocks: get().blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)) },
        tag === undefined ? `update:${id}:${Object.keys(patch).sort().join(",")}` : tag,
      ),

    reset: (id) => {
      const state = get()
      const current = state.blocks.find((block) => block.id === id)
      if (!current) return
      const fresh: Block = {
        ...makeBlock(current.type),
        id,
        text: current.text,
        html: current.html,
        src: current.src,
        alt: current.alt,
        href: current.href,
        author: current.author,
        children: current.children,
      }
      commit({ blocks: state.blocks.map((block) => (block.id === id ? fresh : block)) }, null)
    },

    duplicate: (id) => {
      const state = get()
      const index = state.blocks.findIndex((block) => block.id === id)
      if (index === -1) return
      const copy = cloneBlock(state.blocks[index])
      const blocks = [...state.blocks.slice(0, index + 1), copy, ...state.blocks.slice(index + 1)]
      commit({ blocks, selectedId: copy.id }, null)
    },

    move: (id, direction) => {
      const state = get()
      const index = state.blocks.findIndex((block) => block.id === id)
      const target = index + direction
      if (index === -1 || target < 0 || target >= state.blocks.length) return
      const blocks = [...state.blocks]
      ;[blocks[index], blocks[target]] = [blocks[target], blocks[index]]
      commit({ blocks }, null)
    },

    remove: (id) => {
      const state = get()
      commit(
        {
          blocks: state.blocks.filter((block) => block.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
        },
        null,
      )
    },

    select: (id) => set({ selectedId: id }),

    reorder: (ids) => {
      const state = get()
      const byId = new Map(state.blocks.map((block) => [block.id, block]))
      const next: Block[] = []
      const seen = new Set<string>()
      for (const id of ids) {
        const block = byId.get(id)
        if (!block || seen.has(id)) continue
        seen.add(id)
        next.push(block)
      }
      if (next.length !== state.blocks.length) return
      commit({ blocks: next }, "reorder")
    },

    updateDoc: (patch) =>
      commit({ doc: { ...get().doc, ...patch } }, `doc:${Object.keys(patch).sort().join(",")}`),

    clear: () => commit({ blocks: [], selectedId: null }, null),

    undo: () => {
      const state = get()
      if (state.past.length === 0) return
      const previous = state.past[state.past.length - 1]
      set({
        blocks: previous.blocks,
        doc: previous.doc,
        past: state.past.slice(0, -1),
        future: [{ blocks: state.blocks, doc: state.doc }, ...state.future].slice(0, HISTORY_LIMIT),
        _tag: null,
        selectedId: previous.blocks.some((b) => b.id === state.selectedId) ? state.selectedId : null,
      })
    },

    redo: () => {
      const state = get()
      if (state.future.length === 0) return
      const next = state.future[0]
      set({
        blocks: next.blocks,
        doc: next.doc,
        past: [...state.past, { blocks: state.blocks, doc: state.doc }].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        _tag: null,
        selectedId: next.blocks.some((b) => b.id === state.selectedId) ? state.selectedId : null,
      })
    },
      }
    },
    {
      name: "blockemail:doc",
      version: 2,
      migrate: (persisted, version) => {
        if (version >= 2) return persisted as BuilderState
        const state = (persisted ?? {}) as {
          blocks?: (Block & { spacing?: number })[]
          doc?: Partial<Doc>
        }
        const upgrade = (block: Block & { spacing?: number }): Block => {
          const { spacing, ...rest } = block
          return {
            ...(rest as Block),
            spacingX: EMAIL_GUTTER,
            spacingY: spacing ?? 12,
            fontFamily: null,
            children: (block.children ?? []).map(upgrade),
          }
        }
        return {
          blocks: (state.blocks ?? []).map(upgrade),
          doc: { ...DEFAULT_DOC, ...state.doc },
        } as BuilderState
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ blocks: state.blocks, doc: state.doc }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) bumpSeq(state.blocks)
      },
    },
  ),
)
