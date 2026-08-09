import { APP_NAME } from "@/core/meta"
import { SITE, absolute } from "@/core/meta"
import { BLOCKS, FAQ, STEPS, USE_CASES } from "@/components/landing/content"

export const dynamic = "force-static"

function body(): string {
  return `# ${APP_NAME}

> ${SITE.description}

${APP_NAME} is a free, browser-based drag-and-drop builder for HTML email. You
compose an email from blocks on a 600px canvas, style each block in an inspector,
and export a single self-contained .html file. It does not send email — it
produces the markup you paste into whatever you send with.

- Free to use, with no paid tier gating the export.
- No account required: the editor is public and the document is stored in your
  own browser, not on a server.
- Export is table-based with every style inline, MSO ghost tables for Outlook, a
  web-safe font stack, and columns that stack on narrow screens.

## Links

- [Home](${absolute("/")}): what it is, how it works, and the FAQ.
- [Editor](${absolute("/editor")}): the builder itself — opens on a blank canvas.

## How it works

${STEPS.map((step, i) => `${i + 1}. **${step.title}** — ${step.body}`).join("\n")}

## Block types (${BLOCKS.length})

${BLOCKS.map((block) => `- **${block.label}**: ${block.desc}`).join("\n")}

## Common uses

${USE_CASES.map((useCase) => `- **${useCase.title}**: ${useCase.body}`).join("\n")}

## FAQ

${FAQ.map((entry) => `### ${entry.q}\n\n${entry.a}`).join("\n\n")}
`
}

export function GET() {
  return new Response(body(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  })
}
