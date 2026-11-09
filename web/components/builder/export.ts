import {
  blockFont,
  blockSpacing,
  columnsInset,
  columnWidth,
  EMAIL_WIDTH,
  inColumn,
  parsePairs,
  socialBadge,
  type Align,
  type Block,
  type Doc,
} from "./store"
import { darkColor, darkText } from "./dark"

// Email HTML that holds up across clients: nested tables for layout, every style
// inline, `align`/`bgcolor` attributes for the clients that ignore CSS, an MSO ghost
// table pinning the width in Outlook while everything else gets a fluid
// `width:100%; max-width:600px` column, and dark-mode overrides keyed to classes.

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\r?\n/g, "<br>")
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function hasBg(value: string): boolean {
  return Boolean(value) && value !== "transparent"
}

const isHex = (value: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())

// --- Dark mode ---------------------------------------------------------------
// Every element that carries a colour gets a class naming its dark-mode colour
// (from dark.ts, the same mapping the editor previews with). The classes resolve in
// a `prefers-color-scheme: dark` block — Apple Mail, iOS, Outlook for Mac — and
// again under Outlook.com's `[data-ogsc]`/`[data-ogsb]` dark-mode markers.

class DarkSheet {
  private media = new Map<string, string>()
  private text$ = new Map<string, string>()
  private fill$ = new Map<string, string>()

  constructor(readonly on: boolean) {}

  private add(name: string, decl: string, kind: "text" | "fill") {
    this.media.set(name, decl)
    ;(kind === "text" ? this.text$ : this.fill$).set(name, decl)
    return name
  }

  /** Text colour; `onFill` is the background it sits on, when it has its own. */
  text(color: string, onFill?: string): string {
    if (!this.on || !isHex(color)) return ""
    const target = darkText(color, onFill)
    if (target.toLowerCase() === color.trim().toLowerCase()) return ""
    return this.add(`dmc-${target.slice(1).toLowerCase()}`, `color:${target}!important`, "text")
  }

  fill(color: string): string {
    if (!this.on || !isHex(color)) return ""
    const target = darkColor(color)
    if (target.toLowerCase() === color.trim().toLowerCase()) return ""
    return this.add(
      `dmb-${target.slice(1).toLowerCase()}`,
      `background-color:${target}!important`,
      "fill",
    )
  }

  border(color: string, side: "top" | "left" | "all"): string {
    if (!this.on || !isHex(color)) return ""
    const target = darkColor(color)
    if (target.toLowerCase() === color.trim().toLowerCase()) return ""
    const prop = side === "all" ? "border-color" : `border-${side}-color`
    return this.add(`dmb${side[0]}-${target.slice(1).toLowerCase()}`, `${prop}:${target}!important`, "fill")
  }

  css(): string {
    if (!this.on || this.media.size === 0) return ""
    const rules = (map: Map<string, string>, scope = "") =>
      [...map].map(([name, decl]) => `${scope}.${name}{${decl}}`).join("")
    return (
      `@media (prefers-color-scheme:dark){${rules(this.media)}}` +
      rules(this.text$, "[data-ogsc] ") +
      rules(this.fill$, "[data-ogsb] ")
    )
  }
}

const cls = (...names: string[]) => {
  const list = names.filter(Boolean)
  return list.length ? ` class="${list.join(" ")}"` : ""
}

/** One render: the document, its dark-mode sheet, and the paper colour text sits on. */
type R = { doc: Doc; dm: DarkSheet; paper: string }

/** The fill a block's text sits on: its own band if it has one, else the paper. */
const ground = (block: Block, r: R) => (hasBg(block.background) ? block.background : r.paper)

function cell(block: Block, r: R, inner: string, background?: string): string {
  const { x, y } = blockSpacing(block, r.doc)
  const pad = `${y}px ${x}px`
  const bg = background && hasBg(background) ? background : null
  const bgAttr = bg ? ` bgcolor="${bg}"` : ""
  const bgStyle = bg ? `background-color:${bg};` : ""
  return `        <tr>
          <td align="${block.align}"${bgAttr}${cls(bg ? r.dm.fill(bg) : "")} style="${bgStyle}padding:${pad};">
${inner}
          </td>
        </tr>`
}

const TEXT_SAFE = "overflow-wrap:break-word;word-wrap:break-word;mso-line-height-rule:exactly;"

function heading(block: Block, r: R): string {
  const inner = `            <div${cls(r.dm.text(block.color, ground(block, r)))} style="margin:0;font-family:${blockFont(block, r.doc)};font-size:${block.fontSize}px;line-height:1.3;font-weight:${block.fontWeight};color:${block.color};text-align:${block.align};${TEXT_SAFE}">${escapeText(
    block.text,
  )}</div>`
  return cell(block, r, inner, block.background)
}

function text(block: Block, r: R): string {
  const inner = `            <div${cls(r.dm.text(block.color, ground(block, r)))} style="margin:0;font-family:${blockFont(block, r.doc)};font-size:${block.fontSize}px;line-height:${block.lineHeight};font-weight:${block.fontWeight};color:${block.color};text-align:${block.align};${TEXT_SAFE}">${escapeText(
    block.text,
  )}</div>`
  return cell(block, r, inner, block.background)
}

const LINK_COLOR = "#2563eb"

function normalizeRich(html: string, linkClass: string): string {
  const styled = html
    .replace(/<li><p>/g, "<li>")
    .replace(/<\/p><\/li>/g, "</li>")
    .replace(/<p>/g, '<p style="margin:0 0 16px;">')
    .replace(/<ul>/g, '<ul style="margin:0 0 16px;padding-left:24px;">')
    .replace(/<ol>/g, '<ol style="margin:0 0 16px;padding-left:24px;">')
    .replace(/<a /g, `<a${cls(linkClass)} style="color:${LINK_COLOR};text-decoration:underline;" `)

  return styled.replace(/([\s\S]*)margin:0 0 16px;/, "$1margin:0;")
}

function richtext(block: Block, r: R): string {
  const on = ground(block, r)
  const inner = `            <div${cls(r.dm.text(block.color, on))} style="font-family:${blockFont(block, r.doc)};font-size:${block.fontSize}px;line-height:${block.lineHeight};color:${block.color};text-align:${block.align};${TEXT_SAFE}">${normalizeRich(
    block.html,
    r.dm.text(LINK_COLOR, on),
  )}</div>`
  return cell(block, r, inner, block.background)
}

function image(block: Block, r: R): string {
  if (!block.src.trim()) return ""

  const maxWidth = EMAIL_WIDTH - blockSpacing(block, r.doc).x * 2
  const width = Math.min(block.width, maxWidth)
  const margin = marginFor(block.align)

  let img = `            <img src="${escapeAttr(block.src)}" alt="${escapeAttr(
    block.alt,
  )}" width="${width}" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;width:${width}px;max-width:100%;height:auto;margin:${margin};" />`

  if (block.href.trim())
    img = `            <a href="${escapeAttr(
      block.href,
    )}" target="_blank" style="text-decoration:none;">\n  ${img}\n            </a>`

  return cell(block, r, img)
}

function marginFor(align: Align): string {
  if (align === "center") return "0 auto"
  if (align === "right") return "0 0 0 auto"
  return "0"
}

function button(block: Block, r: R): string {
  const href = block.href.trim() || "#"
  const tableAttrs = block.fullWidth
    ? `width="100%" style="width:100%;"`
    : `align="${block.align}" style="margin:${marginFor(block.align)};"`
  const anchorStyle = block.fullWidth ? "display:block;text-align:center;" : "display:inline-block;"
  const fill = r.dm.fill(block.background)
  const label = r.dm.text(block.color, block.background)
  // Outlook drops padding on an <a>, so the cell carries it there (mso-padding-alt)
  // and the button keeps its size instead of shrinking to a coloured strip of text.
  const inner = `            <table role="presentation" border="0" cellpadding="0" cellspacing="0" ${tableAttrs}><tr><td align="center" bgcolor="${block.background}"${cls(fill)} style="border-radius:${block.radius}px;background-color:${block.background};mso-padding-alt:12px 24px;"><a href="${escapeAttr(
    href,
  )}" target="_blank"${cls(fill, label)} style="${anchorStyle}padding:12px 24px;font-family:${blockFont(block, r.doc)};font-size:${block.fontSize}px;font-weight:${block.fontWeight};line-height:1;color:${block.color};text-decoration:none;border-radius:${block.radius}px;background-color:${block.background};mso-padding-alt:0;">${escapeText(
    block.text,
  )}</a></td></tr></table>`
  return cell(block, r, inner)
}

function divider(block: Block, r: R): string {
  const inner = `            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;"><tr><td${cls(r.dm.border(block.color, "top"))} style="border-top:${block.thickness}px solid ${block.color};font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td></tr></table>`
  return cell(block, r, inner)
}

function spacer(block: Block): string {
  return `        <tr>
          <td style="height:${block.height}px;line-height:${block.height}px;font-size:0;mso-line-height-rule:exactly;">&nbsp;</td>
        </tr>`
}

const TABLE_BORDER = "#e5e7eb"
const TABLE_HEADER_BG = "#f9fafb"

function parseGrid(value: string): string[][] {
  return value.split(/\r?\n/).map((row) => row.split(" | "))
}

function table(block: Block, r: R): string {
  if (!block.text.trim()) return ""

  const on = ground(block, r)
  const body = parseGrid(block.text)
    .map((cells, rowIndex) => {
      const header = block.headerRow && rowIndex === 0
      const border = block.borders ? `border:1px solid ${TABLE_BORDER};` : ""
      const headerBg = header ? `background-color:${TABLE_HEADER_BG};` : ""
      const weight = header ? 700 : block.fontWeight
      const classes = cls(
        block.borders ? r.dm.border(TABLE_BORDER, "all") : "",
        header ? r.dm.fill(TABLE_HEADER_BG) : "",
        r.dm.text(block.color, header ? TABLE_HEADER_BG : on),
      )
      const tds = cells
        .map(
          (value) =>
            `<td${classes} style="${border}${headerBg}padding:8px 12px;font-family:${blockFont(block, r.doc)};font-size:${block.fontSize}px;line-height:1.4;font-weight:${weight};color:${block.color};text-align:${block.align};${TEXT_SAFE}">${escapeText(
              value,
            )}</td>`,
        )
        .join("")
      return `<tr>${tds}</tr>`
    })
    .join("")

  const inner = `            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${body}</table>`
  return cell(block, r, inner, block.background)
}

function list(block: Block, r: R): string {
  const items = block.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (items.length === 0) return ""

  const tag = block.listStyle === "numbered" ? "ol" : "ul"
  const listStyleType =
    block.listStyle === "numbered" ? "decimal" : block.listStyle === "none" ? "none" : "disc"
  const padLeft = block.listStyle === "none" ? "0" : "24px"
  const lis = items
    .map((item, index) => {
      const marginBottom = index === items.length - 1 ? "0" : "8px"
      return `              <li style="margin:0 0 ${marginBottom};">${escapeText(item)}</li>`
    })
    .join("\n")
  const inner = `            <${tag}${cls(r.dm.text(block.color, ground(block, r)))} style="margin:0;padding:0 0 0 ${padLeft};list-style-type:${listStyleType};font-family:${blockFont(block, r.doc)};font-size:${block.fontSize}px;line-height:${block.lineHeight};color:${block.color};text-align:${block.align};${TEXT_SAFE}">
${lis}
            </${tag}>`
  return cell(block, r, inner, block.background)
}

function quote(block: Block, r: R): string {
  const author = block.author.trim()
    ? `            <div${cls(r.dm.text(block.authorColor, r.paper))} style="margin:8px 0 0;font-family:${blockFont(block, r.doc)};font-size:${Math.max(
        12,
        Math.round(block.fontSize * 0.75),
      )}px;line-height:1.4;color:${block.authorColor};text-align:${block.align};${TEXT_SAFE}">— ${escapeText(
        block.author,
      )}</div>`
    : ""
  const inner = `            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;"><tr><td${cls(r.dm.border(block.background, "left"))} style="border-left:4px solid ${block.background};padding:0 0 0 16px;">
              <div${cls(r.dm.text(block.color, r.paper))} style="margin:0;font-family:${blockFont(block, r.doc)};font-size:${block.fontSize}px;line-height:${block.lineHeight};font-style:italic;color:${block.color};text-align:${block.align};${TEXT_SAFE}">${escapeText(
    block.text,
  )}</div>${author ? `\n${author}` : ""}
            </td></tr></table>`
  return cell(block, r, inner)
}

function callout(block: Block, r: R): string {
  if (!block.text.trim()) return ""
  const inner = `            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;"><tr><td bgcolor="${block.background}"${cls(
    r.dm.fill(block.background),
    r.dm.text(block.color, block.background),
  )} style="background-color:${block.background};border-radius:${block.radius}px;padding:16px 20px;font-family:${blockFont(block, r.doc)};font-size:${block.fontSize}px;line-height:${block.lineHeight};color:${block.color};text-align:${block.align};${TEXT_SAFE}">${escapeText(
    block.text,
  )}</td></tr></table>`
  return cell(block, r, inner)
}

const MENU_DOT = "#d1d5db"

function menu(block: Block, r: R): string {
  const items = parsePairs(block.text)
  if (items.length === 0) return ""
  const link = cls(r.dm.text(block.color, r.paper))
  const links = items
    .map(
      (item) =>
        `<a href="${escapeAttr(item.url || "#")}" target="_blank"${link} style="font-family:${blockFont(block, r.doc)};font-size:${block.fontSize}px;font-weight:${block.fontWeight};color:${block.color};text-decoration:none;white-space:nowrap;">${escapeText(
          item.label,
        )}</a>`,
    )
    .join(`<span${cls(r.dm.text(MENU_DOT, r.paper))} style="color:${MENU_DOT};padding:0 8px;">&middot;</span>`)
  const inner = `            <div style="font-family:${blockFont(block, r.doc)};font-size:${block.fontSize}px;line-height:2;text-align:${block.align};">${links}</div>`
  return cell(block, r, inner)
}

function social(block: Block, r: R): string {
  const items = parsePairs(block.text)
  if (items.length === 0) return ""
  const cells = items
    .map((item, index) => {
      const badge = socialBadge(item.label)
      const spacer = index === 0 ? "" : `<td width="8" style="width:8px;font-size:0;line-height:0;">&nbsp;</td>`
      const fill = r.dm.fill(badge.bg)
      const label = r.dm.text("#ffffff", badge.bg)
      return `${spacer}<td width="32" height="32" bgcolor="${badge.bg}"${cls(fill)} style="width:32px;height:32px;background-color:${badge.bg};border-radius:16px;text-align:center;vertical-align:middle;font-family:${blockFont(block, r.doc)};font-size:12px;font-weight:700;color:#ffffff;"><a href="${escapeAttr(
        item.url || "#",
      )}" target="_blank"${cls(label)} style="display:block;line-height:32px;color:#ffffff;text-decoration:none;">${escapeText(
        badge.label,
      )}</a></td>`
    })
    .join("")
  const inner = `            <table role="presentation" align="${block.align}" border="0" cellpadding="0" cellspacing="0" style="margin:${marginFor(
    block.align,
  )};"><tr>${cells}</tr></table>`
  return cell(block, r, inner)
}

function columns(block: Block, r: R): string {
  const kids = block.children.map(inColumn)
  if (kids.length === 0) return ""
  const colMax = columnWidth(block, r.doc)
  const fit = (child: Block): Block =>
    child.type === "image"
      ? {
          ...child,
          width: Math.min(child.width, Math.max(40, colMax - blockSpacing(child, r.doc).x * 2)),
        }
      : child
  const wrap = (child: Block) =>
    `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;">${renderBlock(
      fit(child),
      r,
    )}</table>`
  // Side by side where they fit, stacked full-width where they don't (`bm-col`).
  const div = (child: Block) =>
    `<div class="bm-col" style="display:inline-block;width:100%;max-width:${colMax}px;vertical-align:top;box-sizing:border-box;">${wrap(
      child,
    )}</div>`
  const td = (child: Block) => `<td width="${colMax}" valign="top" style="width:${colMax}px;">${wrap(child)}</td>`
  const inner = `            <div style="font-size:0;text-align:center;">
              <!--[if mso]><table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr>${kids
                .map(td)
                .join("")}</tr></table><![endif]-->
              <!--[if !mso]><!-->${kids.map(div).join("")}<!--<![endif]-->
            </div>`
  return cell({ ...block, spacingX: columnsInset(block, r.doc) }, r, inner)
}

function renderBlock(block: Block, r: R): string {
  switch (block.type) {
    case "heading":
      return heading(block, r)
    case "text":
      return text(block, r)
    case "richtext":
      return richtext(block, r)
    case "list":
      return list(block, r)
    case "quote":
      return quote(block, r)
    case "callout":
      return callout(block, r)
    case "table":
      return table(block, r)
    case "columns":
      return columns(block, r)
    case "button":
      return button(block, r)
    case "menu":
      return menu(block, r)
    case "social":
      return social(block, r)
    case "divider":
      return divider(block, r)
    case "spacer":
      return spacer(block)
    case "image":
    default:
      return image(block, r)
  }
}

function preheader(value: string): string {
  const text = value.trim()
  if (!text) return ""
  return `  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ffffff;opacity:0;">${escapeText(
    text,
  )}${"&#8203;&nbsp;".repeat(40)}</div>`
}

// Resets every client needs: no auto-linked phone numbers or dates restyled by iOS,
// Gmail or Samsung Mail; images without borders; Outlook at 96 DPI so it doesn't
// rescale the layout on high-DPI screens.
const RESETS =
  "body{margin:0!important;padding:0!important;width:100%!important;}" +
  "img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}" +
  "table,td{border-collapse:collapse;}" +
  "a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important;}" +
  "u+#body a,#MessageViewBody a{color:inherit;text-decoration:none;font-size:inherit;font-family:inherit;font-weight:inherit;line-height:inherit;}" +
  "@media only screen and (max-width:620px){.bm-col{max-width:100%!important;}}"

export function renderEmailHtml(blocks: Block[], doc: Doc): string {
  const adapt = doc.darkMode !== "fixed"
  const r: R = { doc, dm: new DarkSheet(adapt), paper: doc.contentBackground }

  const rows = blocks
    .map((block) => renderBlock(block, r))
    .filter(Boolean)
    .join("\n")

  const wall = r.dm.fill(doc.background)
  const paper = r.dm.fill(doc.contentBackground)
  const scheme = adapt ? "light dark" : "light"

  const pre = preheader(doc.description)
  const descMeta = doc.description.trim()
    ? `\n  <meta name="description" content="${escapeAttr(doc.description.trim())}" />`
    : ""

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no" />
  <meta name="color-scheme" content="${scheme}" />
  <meta name="supported-color-schemes" content="${scheme}" />
  <title>${escapeText(doc.title)}</title>${descMeta}
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <style>table,td{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}</style>
  <![endif]-->
  <style>:root{color-scheme:${scheme};supported-color-schemes:${scheme};}${RESETS}${r.dm.css()}</style>
</head>
<body id="body"${cls(wall)} style="margin:0;padding:0;width:100%;background-color:${doc.background};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
${pre ? `${pre}\n` : ""}  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${doc.background}"${cls(wall)} style="width:100%;background-color:${doc.background};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <!--[if mso]><table role="presentation" align="center" width="${EMAIL_WIDTH}" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${doc.contentBackground}"${cls(paper)} style="width:100%;max-width:${EMAIL_WIDTH}px;margin:0 auto;background-color:${doc.contentBackground};">
${rows}
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
`
}
