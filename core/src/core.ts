import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { Context } from 'hono'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { jwt, sign } from 'hono/jwt'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { lt, sql } from 'drizzle-orm'
import { activityLog, dailyStats, pageStats, type LogEvent, type Metric } from '@/db/schema'
import type { DB } from '@/db'

export { createRoute, z }

// --- App config ---

export const APP_NAME = 'Blokma'
export const SUPPORT_EMAIL = 'support@app.com'

// --- Identity ---


type SessionPayload = {
  sub: string
  email?: string
  name?: string
  exp: number
}

// --- Env ---

export type AppEnv = {
  Bindings: CloudflareBindings
  Variables: { jwtPayload: SessionPayload; db: DB }
}

// --- App factory ---

export const createApp = () => {
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (result, c) => {
      if (!result.success)
        return fail(c, 400, 'validation_failed', 'Request validation failed.', result.error.issues)
    },
  })

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      const code = err.status === 401 ? 'unauthorized' : 'http_error'
      return fail(c, err.status, code, err.message || 'Request failed.')
    }
    console.error(err)
    return fail(c, 500, 'internal_error', 'Something went wrong.')
  })

  return app
}

// --- Auth guard ---

export const requireAuth = createMiddleware<AppEnv>((c, next) =>
  jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' })(c, next),
)

// --- Envelope (private) ---

const success = <T extends z.ZodType>(data: T) =>
  z.object({ success: z.literal(true), data, error: z.null() })

const ErrorSchema = z
  .object({
    success: z.literal(false),
    data: z.null(),
    error: z.object({ code: z.string(), message: z.string(), issues: z.unknown().optional() }),
  })
  .openapi('Error')

// --- Doc helpers (for `request` / `responses`) ---

export const json = <T>(schema: T) => ({ content: { 'application/json': { schema } } })

export const res = {
  ok: <T extends z.ZodType>(schema: T, description: string) => ({
    description,
    ...json(success(schema)),
  }),
  err: (description: string) => ({ description, ...json(ErrorSchema) }),
}

// --- Handler helpers (wire shape enforced by each route's `responses`) ---

export const ok = <T>(c: Context, data: T, status: ContentfulStatusCode = 200): any =>
  c.json({ success: true, data, error: null }, status)

export const fail = (
  c: Context,
  status: ContentfulStatusCode,
  code: string,
  message: string,
  issues?: unknown,
): any =>
  c.json(
    { success: false, data: null, error: { code, message, ...(issues ? { issues } : {}) } },
    status,
  )

// --- Crypto primitives ---

const enc = new TextEncoder()
const ITERATIONS = 100_000

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

const fromHex = (hex: string) =>
  new Uint8Array((hex.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16)))



export const timingEq = (a: string, b: string) => {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// --- Password hashing (PBKDF2-HMAC-SHA256 via Web Crypto; stored as `salt:hash` hex) ---

const derive = async (password: string, salt: Uint8Array) => {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  )
  return toHex(bits)
}

export const hashPassword = async (password: string) => {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return `${toHex(salt)}:${await derive(password, salt)}`
}

export const verifyPassword = async (password: string, stored: string) => {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  return timingEq(await derive(password, fromHex(salt)), hash)
}

// Verified against when no account matches, so a miss costs the same time as a hit.
export const NO_SUCH_PASSWORD = `${'0'.repeat(32)}:${'0'.repeat(64)}`

// --- Sessions (JWT) ---

const TOKEN_TTL = 60 * 60 * 24

export const createToken = (
  secret: string,
  user: { id: string; name?: string | null; email?: string | null },
) =>
  sign(
    {
      sub: user.id,
      ...(user.email ? { email: user.email } : {}),
      ...(user.name ? { name: user.name } : {}),
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL,
    } satisfies SessionPayload,
    secret,
  )

// --- Verification codes ---

export const CODE_TTL_MINUTES = 10
export const CODE_TTL_MS = CODE_TTL_MINUTES * 60 * 1000

const RESEND_COOLDOWN_SECONDS = 60
export const RESEND_COOLDOWN_MS = RESEND_COOLDOWN_SECONDS * 1000

export const MAX_CODE_ATTEMPTS = 5

export const generateCode = () => {
  const max = 1_000_000
  const limit = Math.floor(0x1_0000_0000 / max) * max
  let n = crypto.getRandomValues(new Uint32Array(1))[0]
  while (n >= limit) n = crypto.getRandomValues(new Uint32Array(1))[0]
  return String(n % max).padStart(6, '0')
}

// --- Phone numbers ---

export const DIAL_CODES = new Set(
  `1 7 20 27 30 31 32 33 34 36 39 40 41 43 44 45 46 47 48 49 51 52 53 54 55 56 57 58 60 61 62 63 64
   65 66 81 82 84 86 90 91 92 93 94 95 98 211 212 213 216 218 220 221 222 223 224 225 226 227 228
   229 230 231 232 233 234 235 236 237 238 239 240 241 242 243 244 245 246 248 249 250 251 252 253
   254 255 256 257 258 260 261 262 263 264 265 266 267 268 269 290 291 297 298 299 350 351 352 353
   354 355 356 357 358 359 370 371 372 373 374 375 376 377 378 379 380 381 382 383 385 386 387 389
   420 421 423 500 501 502 503 504 505 506 507 508 509 590 591 592 593 594 595 596 597 598 670 672
   673 674 675 676 677 678 679 680 681 682 683 685 686 687 688 689 690 691 692 850 852 853 855 856
   880 886 960 961 962 963 964 965 966 967 968 970 971 972 973 974 975 976 977 992 993 994 995 996
   998 1242 1246 1264 1268 1284 1340 1345 1441 1473 1649 1664 1670 1671 1684 1758 1767 1784 1849
   1868 1869 1876 1939`.split(/\s+/),
)

export const normalizeE164 = (input: string): string | null => {
  const e164 = input.replace(/[\s().-]/g, '')
  return /^\+[1-9]\d{6,14}$/.test(e164) ? e164 : null
}

// --- Activity log ---

const ACTIVITY_TTL_DAYS = 30

type Entry =
  | { event: Extract<LogEvent, 'verification.sent'>; channel: 'sms' | 'email'; subject: string; code: string; status: 'ok' | 'failed'; userId: string | null }
  | { event: Extract<LogEvent, 'user.registered' | 'user.signed_in' | 'user.signed_out'>; subject: string; userId: string }

type Uncovered = Exclude<LogEvent, Entry['event']>
const _exhaustive: [Uncovered] extends [never] ? true : ['no log entry shape for', Uncovered] = true

// --- Daily counters ---

export const today = () => new Date().toISOString().slice(0, 10)

// Runs work AFTER the response has been sent, and swallows anything it throws.
//
// Every counter goes through here. Nothing measured about a request may delay it,
// change it, or fail it: a write that blocks the response has made analytics part of
// the product's latency, and one that throws has made it part of the product's
// reliability. waitUntil keeps the isolate alive for the work without the client
// waiting on it; the catch means a rejection can never reach the runtime as an
// unhandled one. If waitUntil is unavailable the promise still runs, still caught.
export function after(c: Context<AppEnv>, work: Promise<unknown>) {
  const quiet = Promise.resolve(work).catch(() => {})
  try {
    c.executionCtx.waitUntil(quiet)
  } catch {
    void quiet
  }
}

export function bump(c: Context<AppEnv>, metric: Metric) {
  // Headers are read now, synchronously, not inside the deferred work: the request
  // is not guaranteed to be readable once the response has gone.
  const country = c.req.header('cf-ipcountry') ?? 'XX'
  after(
    c,
    c.var.db
      .insert(dailyStats)
      .values({ day: today(), metric, country, count: 1 })
      .onConflictDoUpdate({
        target: [dailyStats.day, dailyStats.metric, dailyStats.country],
        set: { count: sql`${dailyStats.count} + 1` },
      }),
  )
}

export function bumpPage(c: Context<AppEnv>, path: string) {
  after(
    c,
    c.var.db
      .insert(pageStats)
      .values({ day: today(), path, count: 1 })
      .onConflictDoUpdate({
        target: [pageStats.day, pageStats.path],
        set: { count: sql`${pageStats.count} + 1` },
      }),
  )
}

const LOG_METRIC: Partial<Record<LogEvent, Metric>> = {
  'user.registered': 'signup',
  'user.signed_in': 'login',
}

export async function log(c: Context<AppEnv>, entry: Entry) {
  const { db } = c.var
  const env = c.env
  const keepCode = env.ENVIRONMENT !== 'production' || env.LOG_CODES === 'true'

  try {
    const sent = entry.event === 'verification.sent'
    await db.insert(activityLog).values({
      userId: entry.userId ?? null,
      event: entry.event,
      subject: entry.subject,
      status: 'status' in entry ? entry.status : 'ok',
      channel: sent ? entry.channel : null,
      code: sent && keepCode ? entry.code : null,
      detail: null,
      payload: null,
      country: c.req.header('cf-ipcountry') ?? null,
      userAgent: c.req.header('user-agent') ?? null,
    })
  } catch (err) {
    console.error('[activity] could not write the log', err)
  }

  const metric = LOG_METRIC[entry.event]
  if (metric) bump(c, metric)

  // Deferred, so a sweep can never eat the row it rides along with, nor the sign-in
  // that wrote it.
  const cutoff = new Date(Date.now() - ACTIVITY_TTL_DAYS * 24 * 60 * 60 * 1000)
  after(c, db.delete(activityLog).where(lt(activityLog.createdAt, cutoff)))
}
