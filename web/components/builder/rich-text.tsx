"use client"

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Strikethrough,
  Underline,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Toggle } from "@/components/ui/toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const EXTENSIONS = [
  StarterKit.configure({
    heading: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    blockquote: false,
  }),
]

const SURFACE = cn(
  "min-h-24 max-h-64 overflow-y-auto p-2.5 text-sm outline-none",
  "[&_p]:my-0 [&_p:not(:last-child)]:mb-3",
  "[&_ul]:my-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-0 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_a]:text-[#2563eb] [&_a]:underline [&_strong]:font-semibold",
)

export function RichTextField({
  value,
  onChange,
}: {
  value: string
  onChange: (html: string) => void
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: EXTENSIONS,
    content: value || "<p></p>",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: SURFACE } },
  })

  if (!editor) return <div className="min-h-24 rounded-lg border border-input" />

  return (
    <div className="overflow-hidden rounded-lg border border-input">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      bullet: editor.isActive("bulletList"),
      ordered: editor.isActive("orderedList"),
      link: editor.isActive("link"),
    }),
  })

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border p-1">
      <Tool label="Bold" pressed={active.bold} onToggle={() => editor.chain().focus().toggleBold().run()}>
        <Bold />
      </Tool>
      <Tool label="Italic" pressed={active.italic} onToggle={() => editor.chain().focus().toggleItalic().run()}>
        <Italic />
      </Tool>
      <Tool label="Underline" pressed={active.underline} onToggle={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline />
      </Tool>
      <Tool label="Strikethrough" pressed={active.strike} onToggle={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough />
      </Tool>
      <span className="mx-0.5 h-4 w-px bg-border" />
      <Tool label="Bullet list" pressed={active.bullet} onToggle={() => editor.chain().focus().toggleBulletList().run()}>
        <List />
      </Tool>
      <Tool label="Numbered list" pressed={active.ordered} onToggle={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered />
      </Tool>
      <Tool label="Link" pressed={active.link} onToggle={() => toggleLink(editor)}>
        <LinkIcon />
      </Tool>
    </div>
  )
}

function toggleLink(editor: Editor) {
  if (editor.isActive("link")) {
    editor.chain().focus().unsetLink().run()
    return
  }
  const url = window.prompt("Link URL")?.trim()
  if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
}

function Tool({
  label,
  pressed,
  onToggle,
  children,
}: {
  label: string
  pressed: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          size="sm"
          pressed={pressed}
          onPressedChange={onToggle}
          aria-label={label}
          className="data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
        >
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
