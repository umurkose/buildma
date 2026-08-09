import {
  blockFont,
  blockSpacing,
  EMAIL_WIDTH,
  parsePairs,
  socialBadge,
  type Align,
  type Block,
  type Doc,
} from "./store"

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

function cell(block: Block, doc: Doc, inner: string, background?: string): string {
  const { x, y } = blockSpacing(block, doc)
  const pad = `${y}px ${x}px`
  const bgAttr = background && hasBg(background) ? ` bgcolor="${background}"` : ""
  const bgStyle = background && hasBg(background) ? `background-color:${background};` : ""
  return `        <tr>
          <td align="${block.align}"${bgAttr} style="${bgStyle}padding:${pad};">
${inner}
          </td>
        </tr>`
}

function heading(block: Block, doc: Doc): string {
  const inner = `            <div style="margin:0;font-family:${blockFont(block, doc)};font-size:${block.fontSize}px;line-height:1.3;font-weight:${block.fontWeight};color:${block.color};text-align:${block.align};mso-line-height-rule:exactly;">${escapeText(
    block.text,
  )}</div>`
  return cell(block, doc, inner, block.background)
}

function text(block: Block, doc: Doc): string {
  const inner = `            <div style="margin:0;font-family:${blockFont(block, doc)};font-size:${block.fontSize}px;line-height:${block.lineHeight};font-weight:${block.fontWeight};color:${block.color};text-align:${block.align};mso-line-height-rule:exactly;">${escapeText(
    block.text,
  )}</div>`
  return cell(block, doc, inner, block.background)
}

const LINK_COLOR = "#2563eb"

function normalizeRich(html: string): string {
  const styled = html
    .replace(/<li><p>/g, "<li>")
    .replace(/<\/p><\/li>/g, "</li>")
    .replace(/<p>/g, '<p style="margin:0 0 16px;">')
    .replace(/<ul>/g, '<ul style="margin:0 0 16px;padding-left:24px;">')
    .replace(/<ol>/g, '<ol style="margin:0 0 16px;padding-left:24px;">')
    .replace(/<a /g, `<a style="color:${LINK_COLOR};text-decoration:underline;" `)

  return styled.replace(/([\s\S]*)margin:0 0 16px;/, "$1margin:0;")
}

function richtext(block: Block, doc: Doc): string {
  const inner = `            <div style="font-family:${blockFont(block, doc)};font-size:${block.fontSize}px;line-height:${block.lineHeight};color:${block.color};text-align:${block.align};">${normalizeRich(
    block.html,
  )}</div>`
  return cell(block, doc, inner, block.background)
}

function image(block: Block, doc: Doc): string {
  if (!block.src.trim()) return ""

  const maxWidth = EMAIL_WIDTH - blockSpacing(block, doc).x * 2
  const width = Math.min(block.width, maxWidth)
  const margin = marginFor(block.align)

  let img = `            <img src="${escapeAttr(block.src)}" alt="${escapeAttr(
    block.alt,
  )}" width="${width}" style="display:block;border:0;outline:none;text-decoration:none;width:${width}px;max-width:100%;height:auto;margin:${margin};" />`

  if (block.href.trim())
    img = `            <a href="${escapeAttr(
      block.href,
    )}" target="_blank" style="text-decoration:none;">\n  ${img}\n            </a>`

  return cell(block, doc, img)
}

function marginFor(align: Align): string {
  if (align === "center") return "0 auto"
  if (align === "right") return "0 0 0 auto"
  return "0"
}

function button(block: Block, doc: Doc): string {
  const href = block.href.trim() || "#"
  const tableAttrs = block.fullWidth
    ? `width="100%" style="width:100%;"`
    : `align="${block.align}" style="margin:${marginFor(block.align)};"`
  const anchorStyle = block.fullWidth ? "display:block;text-align:center;" : "display:inline-block;"
  const inner = `            <table role="presentation" border="0" cellpadding="0" cellspacing="0" ${tableAttrs}><tr><td align="center" bgcolor="${block.background}" style="border-radius:${block.radius}px;"><a href="${escapeAttr(
    href,
  )}" target="_blank" style="${anchorStyle}padding:12px 24px;font-family:${blockFont(block, doc)};font-size:${block.fontSize}px;font-weight:${block.fontWeight};line-height:1;color:${block.color};text-decoration:none;border-radius:${block.radius}px;background-color:${block.background};">${escapeText(
    block.text,
  )}</a></td></tr></table>`
  return cell(block, doc, inner)
}

function divider(block: Block, doc: Doc): string {
  const inner = `            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td style="border-top:${block.thickness}px solid ${block.color};font-size:0;line-height:0;">&nbsp;</td></tr></table>`
  return cell(block, doc, inner)
}

function spacer(block: Block): string {
  return `        <tr>
          <td style="height:${block.height}px;line-height:${block.height}px;font-size:0;">&nbsp;</td>
        </tr>`
}

const TABLE_BORDER = "#e5e7eb"
const TABLE_HEADER_BG = "#f9fafb"

function parseGrid(value: string): string[][] {
  return value.split(/\r?\n/).map((row) => row.split(" | "))
}

function table(block: Block, doc: Doc): string {
  if (!block.text.trim()) return ""

  const body = parseGrid(block.text)
    .map((cells, rowIndex) => {
      const header = block.headerRow && rowIndex === 0
      const border = block.borders ? `border:1px solid ${TABLE_BORDER};` : ""
      const headerBg = header ? `background-color:${TABLE_HEADER_BG};` : ""
      const weight = header ? 700 : block.fontWeight
      const tds = cells
        .map(
          (value) =>
            `<td style="${border}${headerBg}padding:8px 12px;font-family:${blockFont(block, doc)};font-size:${block.fontSize}px;line-height:1.4;font-weight:${weight};color:${block.color};text-align:${block.align};mso-line-height-rule:exactly;">${escapeText(
              value,
            )}</td>`,
        )
        .join("")
      return `<tr>${tds}</tr>`
    })
    .join("")

  const inner = `            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${body}</table>`
  return cell(block, doc, inner, block.background)
}

function list(block: Block, doc: Doc): string {
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
  const inner = `            <${tag} style="margin:0;padding:0 0 0 ${padLeft};list-style-type:${listStyleType};font-family:${blockFont(block, doc)};font-size:${block.fontSize}px;line-height:${block.lineHeight};color:${block.color};text-align:${block.align};">
${lis}
            </${tag}>`
  return cell(block, doc, inner, block.background)
}

function quote(block: Block, doc: Doc): string {
  const author = block.author.trim()
    ? `            <div style="margin:8px 0 0;font-family:${blockFont(block, doc)};font-size:${Math.max(
        12,
        Math.round(block.fontSize * 0.75),
      )}px;line-height:1.4;color:${block.authorColor};text-align:${block.align};mso-line-height-rule:exactly;">— ${escapeText(
        block.author,
      )}</div>`
    : ""
  const inner = `            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td style="border-left:4px solid ${block.background};padding:0 0 0 16px;">
              <div style="margin:0;font-family:${blockFont(block, doc)};font-size:${block.fontSize}px;line-height:${block.lineHeight};font-style:italic;color:${block.color};text-align:${block.align};mso-line-height-rule:exactly;">${escapeText(
    block.text,
  )}</div>${author ? `\n${author}` : ""}
            </td></tr></table>`
  return cell(block, doc, inner)
}

function callout(block: Block, doc: Doc): string {
  if (!block.text.trim()) return ""
  const inner = `            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;"><tr><td bgcolor="${block.background}" style="background-color:${block.background};border-radius:${block.radius}px;padding:16px 20px;font-family:${blockFont(block, doc)};font-size:${block.fontSize}px;line-height:${block.lineHeight};color:${block.color};text-align:${block.align};mso-line-height-rule:exactly;">${escapeText(
    block.text,
  )}</td></tr></table>`
  return cell(block, doc, inner)
}

function menu(block: Block, doc: Doc): string {
  const items = parsePairs(block.text)
  if (items.length === 0) return ""
  const links = items
    .map(
      (item) =>
        `<a href="${escapeAttr(item.url || "#")}" target="_blank" style="font-family:${blockFont(block, doc)};font-size:${block.fontSize}px;font-weight:${block.fontWeight};color:${block.color};text-decoration:none;white-space:nowrap;">${escapeText(
          item.label,
        )}</a>`,
    )
    .join(`<span style="color:#d1d5db;padding:0 8px;">&middot;</span>`)
  const inner = `            <div style="font-family:${blockFont(block, doc)};font-size:${block.fontSize}px;line-height:2;text-align:${block.align};">${links}</div>`
  return cell(block, doc, inner)
}

function social(block: Block, doc: Doc): string {
  const items = parsePairs(block.text)
  if (items.length === 0) return ""
  const cells = items
    .map((item, index) => {
      const badge = socialBadge(item.label)
      const spacer = index === 0 ? "" : `<td width="8" style="width:8px;font-size:0;line-height:0;">&nbsp;</td>`
      return `${spacer}<td width="32" height="32" bgcolor="${badge.bg}" style="width:32px;height:32px;background-color:${badge.bg};border-radius:16px;text-align:center;vertical-align:middle;font-family:${blockFont(block, doc)};font-size:12px;font-weight:700;color:#ffffff;"><a href="${escapeAttr(
        item.url || "#",
      )}" target="_blank" style="display:block;line-height:32px;color:#ffffff;text-decoration:none;">${escapeText(
        badge.label,
      )}</a></td>`
    })
    .join("")
  const inner = `            <table role="presentation" align="${block.align}" border="0" cellpadding="0" cellspacing="0" style="margin:${marginFor(
    block.align,
  )};"><tr>${cells}</tr></table>`
  return cell(block, doc, inner)
}

function columns(block: Block, doc: Doc): string {
  const kids = block.children
  if (kids.length === 0) return ""
  const colMax = Math.floor((EMAIL_WIDTH - blockSpacing(block, doc).x * 2) / kids.length)
  const fit = (child: Block): Block =>
    child.type === "image"
      ? {
          ...child,
          width: Math.min(child.width, Math.max(40, colMax - blockSpacing(child, doc).x * 2)),
        }
      : child
  const wrap = (child: Block) =>
    `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;">${renderBlock(
      fit(child),
      doc,
    )}</table>`
  const div = (child: Block) =>
    `<div style="display:inline-block;width:100%;max-width:${colMax}px;vertical-align:top;box-sizing:border-box;">${wrap(
      child,
    )}</div>`
  const td = (child: Block) => `<td width="${colMax}" valign="top">${wrap(child)}</td>`
  const inner = `            <div style="font-size:0;text-align:center;">
              <!--[if mso]><table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr>${kids
                .map(td)
                .join("")}</tr></table><![endif]-->
              <!--[if !mso]><!-->${kids.map(div).join("")}<!--<![endif]-->
            </div>`
  return cell(block, doc, inner)
}

function renderBlock(block: Block, doc: Doc): string {
  switch (block.type) {
    case "heading":
      return heading(block, doc)
    case "text":
      return text(block, doc)
    case "richtext":
      return richtext(block, doc)
    case "list":
      return list(block, doc)
    case "quote":
      return quote(block, doc)
    case "callout":
      return callout(block, doc)
    case "table":
      return table(block, doc)
    case "columns":
      return columns(block, doc)
    case "button":
      return button(block, doc)
    case "menu":
      return menu(block, doc)
    case "social":
      return social(block, doc)
    case "divider":
      return divider(block, doc)
    case "spacer":
      return spacer(block)
    case "image":
    default:
      return image(block, doc)
  }
}

function preheader(value: string): string {
  const text = value.trim()
  if (!text) return ""
  return `  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${"#ffffff"};opacity:0;">${escapeText(
    text,
  )}${"&#8203;".repeat(80)}</div>`
}

export function renderEmailHtml(blocks: Block[], doc: Doc): string {
  const rows = blocks
    .map((block) => renderBlock(block, doc))
    .filter(Boolean)
    .join("\n")

  const pre = preheader(doc.description)
  const descMeta = doc.description.trim()
    ? `\n  <meta name="description" content="${escapeAttr(doc.description.trim())}" />`
    : ""

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeText(doc.title)}</title>${descMeta}
  <style>:root{color-scheme:light dark;supported-color-schemes:light dark;}</style>
  <!--[if mso]>
  <style>table,td{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;width:100%;background-color:${doc.background};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
${pre ? `${pre}\n` : ""}  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${doc.background};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <!--[if mso]><table role="presentation" width="${EMAIL_WIDTH}" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="${EMAIL_WIDTH}" cellpadding="0" cellspacing="0" border="0" style="width:${EMAIL_WIDTH}px;max-width:${EMAIL_WIDTH}px;margin:0 auto;background-color:${doc.contentBackground};">
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
