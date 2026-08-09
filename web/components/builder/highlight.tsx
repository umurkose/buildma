import { Fragment } from "react"

type Kind = "comment" | "doctype" | "punct" | "tag" | "attr" | "string" | "text"

type Token = { kind: Kind; value: string }

const CLASS: Record<Kind, string> = {
  comment: "text-muted-foreground italic",
  doctype: "text-muted-foreground",
  punct: "text-muted-foreground",
  tag: "text-foreground",
  attr: "text-muted-foreground",
  string: "text-success",
  text: "text-foreground",
}

const TOP = /<!--[\s\S]*?-->|<!DOCTYPE[^>]*>/gi
const TAG = /<\/?[a-zA-Z][^>]*>/g

const ATTR = /([a-zA-Z_:][\w:.-]*)(\s*=\s*)("(?:[^"]*)"|'(?:[^']*)')|(\s+)|(\S+?)/g

function tokenizeTag(tag: string): Token[] {
  const m = /^(<\/?)([a-zA-Z][\w-]*)([\s\S]*?)(\/?>)$/.exec(tag)
  if (!m) return [{ kind: "tag", value: tag }]

  const out: Token[] = [
    { kind: "punct", value: m[1] },
    { kind: "tag", value: m[2] },
  ]

  for (const a of m[3].matchAll(ATTR)) {
    if (a[1] !== undefined) {
      out.push({ kind: "attr", value: a[1] })
      out.push({ kind: "punct", value: a[2] })
      out.push({ kind: "string", value: a[3] })
    } else if (a[4] !== undefined) {
      out.push({ kind: "text", value: a[4] })
    } else if (a[5] !== undefined) {
      out.push({ kind: "punct", value: a[5] })
    }
  }

  out.push({ kind: "punct", value: m[4] })
  return out
}

function tokenize(src: string): Token[] {
  const out: Token[] = []
  let cursor = 0

  const pushTagsAndText = (chunk: string) => {
    let last = 0
    for (const m of chunk.matchAll(TAG)) {
      if (m.index > last) out.push({ kind: "text", value: chunk.slice(last, m.index) })
      out.push(...tokenizeTag(m[0]))
      last = m.index + m[0].length
    }
    if (last < chunk.length) out.push({ kind: "text", value: chunk.slice(last) })
  }

  for (const m of src.matchAll(TOP)) {
    if (m.index > cursor) pushTagsAndText(src.slice(cursor, m.index))
    out.push({ kind: m[0].startsWith("<!--") ? "comment" : "doctype", value: m[0] })
    cursor = m.index + m[0].length
  }
  if (cursor < src.length) pushTagsAndText(src.slice(cursor))

  return out
}

export function HighlightedHtml({ html }: { html: string }) {
  const tokens = tokenize(html)
  return (
    <>
      {tokens.map((token, index) =>
        token.kind === "text" ? (
          <Fragment key={index}>{token.value}</Fragment>
        ) : (
          <span key={index} className={CLASS[token.kind]}>
            {token.value}
          </span>
        ),
      )}
    </>
  )
}
