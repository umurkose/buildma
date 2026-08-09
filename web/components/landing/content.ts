// --- Block palette ---------------------------------------------------------

export const BLOCKS: { key: string; label: string; icon: string; desc: string }[] = [
  { key: "heading", label: "Heading", icon: "Heading", desc: "A bold title line." },
  { key: "text", label: "Text", icon: "Type", desc: "A paragraph of plain text." },
  { key: "richtext", label: "Rich Text", icon: "Pilcrow", desc: "Bold, italics, links, lists." },
  { key: "list", label: "List", icon: "List", desc: "Bulleted or numbered items." },
  { key: "quote", label: "Quote", icon: "Quote", desc: "A pull-quote with attribution." },
  { key: "callout", label: "Callout", icon: "Megaphone", desc: "A highlighted notice box." },
  { key: "table", label: "Table", icon: "Table", desc: "A grid of rows and cells." },
  { key: "image", label: "Image", icon: "Image", desc: "A picture loaded from a URL." },
  { key: "columns", label: "Columns", icon: "Columns2", desc: "Blocks placed side by side." },
  { key: "button", label: "Button", icon: "MousePointerClick", desc: "A tappable call-to-action." },
  { key: "menu", label: "Menu", icon: "Menu", desc: "A row of navigation links." },
  { key: "social", label: "Social", icon: "Share2", desc: "Links to your social profiles." },
  { key: "divider", label: "Divider", icon: "Minus", desc: "A horizontal separator line." },
  { key: "spacer", label: "Spacer", icon: "MoveVertical", desc: "Empty vertical space." },
]

// --- Editor capabilities ---------------------------------------------------

export const CAPABILITIES: { key: string; icon: string; title: string; body: string }[] = [
  {
    key: "dnd",
    icon: "MousePointer2",
    title: "Drag, drop, reorder",
    body: "Drop a block anywhere, move it later. The canvas is the 600px paper your email ships on.",
  },
  {
    key: "history",
    icon: "Undo2",
    title: "100 steps of undo",
    body: "A slider drag or a typed word is one step, so going back feels like going back.",
  },
  {
    key: "autosave",
    icon: "HardDriveDownload",
    title: "Saved as you work",
    body: "Your draft lives in your browser and is waiting when you return — no account, no save button.",
  },
  {
    key: "inspector",
    icon: "SlidersHorizontal",
    title: "One grouped inspector",
    body: "Colour, size, weight, alignment, spacing, width — every control writes straight to the canvas.",
  },
  {
    key: "body",
    icon: "Frame",
    title: "Document settings",
    body: "The wall behind the email, the column's background, the title, and the preheader line.",
  },
  {
    key: "export",
    icon: "FileCode2",
    title: "Copy or download",
    body: "Read the generated markup, copy it to the clipboard, or take the .html file.",
  },
]

// --- How it works ----------------------------------------------------------

export const STEPS: { key: string; label: string; title: string; body: string }[] = [
  {
    key: "build",
    label: "Build",
    title: "Drag a block. That's the whole idea.",
    body: "No template to fight, no table markup to nest. Take what the email needs, put it where it goes, and move it again whenever you change your mind.",
  },
  {
    key: "style",
    label: "Style",
    title: "Change it and see it, at once",
    body: "Colour, size, corners, width — every control writes straight to the canvas. There is no preview button, because there is nothing left to preview.",
  },
  {
    key: "export",
    label: "Export",
    title: "Leave with a file you own",
    body: "One .html, yours to keep. It opens in any editor, pastes into any sending platform, and never needs us again to render it.",
  },
]

// --- What the exporter guarantees ------------------------------------------

// --- Use cases -------------------------------------------------------------

export const USE_CASES: { key: string; icon: string; title: string; body: string }[] = [
  {
    key: "transactional",
    icon: "ShieldCheck",
    title: "Transactional email",
    body: "Verification codes, resets, receipts. Five blocks and no template engine.",
  },
  {
    key: "newsletter",
    icon: "Newspaper",
    title: "Newsletters",
    body: "A masthead, this week's links, a button, a social row. Duplicate it next week.",
  },
  {
    key: "announcement",
    icon: "Megaphone",
    title: "Product announcements",
    body: "A hero image, a callout, a two-column feature row, one full-width CTA.",
  },
  {
    key: "onboarding",
    icon: "Sparkles",
    title: "Welcome and onboarding",
    body: "A warm opening, a numbered list of first steps, one button back into the product.",
  },
  {
    key: "internal",
    icon: "Building2",
    title: "Internal updates",
    body: "A table of numbers, a divider, a quote. Nothing to install to send it.",
  },
  {
    key: "handoff",
    icon: "GitBranch",
    title: "Developer handoff",
    body: "Design it visually, read the markup, drop the file into your own pipeline.",
  },
]

// --- FAQ -------------------------------------------------------------------

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Is Blokma free?",
    a: "Yes. The editor is free to use and there is no paid tier gating the export — you can build an email and download the HTML without paying anything.",
  },
  {
    q: "Do I need an account to build an email?",
    a: "No. Open the editor and start dragging blocks. An account is optional and only exists for the dashboard; the builder itself never asks you to sign in.",
  },
  {
    q: "What exactly do I get when I export?",
    a: "A single .html file containing the whole email: a 600px content column built from nested tables, every style written inline, MSO ghost tables for Outlook and a web-safe font stack. You can copy it to the clipboard or download the file.",
  },
  {
    q: "Will the email render correctly in Outlook?",
    a: "That is what the exporter is built around. Outlook renders with Word's engine, so Blokma emits tables instead of divs, pins the column width with conditional ghost tables, and sets mso-line-height-rule:exactly so leading is not inflated.",
  },
  {
    q: "Can I use the HTML with Mailchimp, Klaviyo, HubSpot or SendGrid?",
    a: "Yes. Blokma does not send email — it produces standard HTML. Paste the exported markup into any platform that accepts a custom HTML template, or hand it to your own sending code.",
  },
  {
    q: "Are the emails responsive on mobile?",
    a: "The content column is capped at 600px and shrinks with the viewport, and side-by-side columns are built as inline-blocks with a max width so they stack into a single column on narrow screens.",
  },
  {
    q: "Where is my work saved?",
    a: "While you edit, only in your own browser: the draft is written to local storage and restored the next time you open the editor, so nothing is lost on refresh. When you download or copy the HTML, that finished email is also saved on our side so we can see which blocks people actually use. Drafts are never sent anywhere, and neither carries a name, an email address or an IP.",
  },
  {
    q: "How do images work?",
    a: "The image block takes a URL. Host the file anywhere that serves it publicly — your site, a CDN, an asset host — and paste the link, plus alt text for the clients that block images by default.",
  },
  {
    q: "Can I undo a mistake?",
    a: "Yes, up to 100 steps. Consecutive edits of the same kind, like dragging a slider or typing a word, collapse into a single undo step so history moves the way you expect.",
  },
  {
    q: "Do I need to know HTML or CSS?",
    a: "No. Blokma is a visual builder — you drag blocks and move controls. The generated markup is there in the code preview if you want to read it, but you never have to write it.",
  },
]

// --- Hero proof points -----------------------------------------------------

export const PROOFS: { icon: string; label: string }[] = [
  { icon: "Gift", label: "Free" },
  { icon: "BadgeCheck", label: "No sign-up" },
  { icon: "Wand2", label: "No code" },
  { icon: "MousePointerClick", label: "Drag & drop" },
  { icon: "Eye", label: "Live preview" },
  { icon: "FileCode2", label: "HTML export" },
  { icon: "Inbox", label: "Outlook-safe" },
]
