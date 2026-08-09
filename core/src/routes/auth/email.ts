import { and, eq, gt, lt, sql } from 'drizzle-orm'
import { users, emailVerifications } from '@/db/schema'
import type { Context } from 'hono'
import {
  createApp,
  type AppEnv,
  createRoute,
  z,
  ok,
  fail,
  json,
  res,
  hashPassword,
  verifyPassword,
  timingEq,
  createToken,
  generateCode,
  CODE_TTL_MS,
  RESEND_COOLDOWN_MS,
  MAX_CODE_ATTEMPTS,
  NO_SUCH_PASSWORD,
  log,
} from '@/core'
import { spend, refund } from '@/notify/budget'
import { email_verification } from '@/notify/templates'
import { findUser, User } from '../user'

export const emailAuth = createApp()

// --- Schemas ---

const email = z.string().trim().toLowerCase().pipe(z.email())
const code = z.string().trim().length(6)

const RegisterBody = z
  .object({ name: z.string().trim().min(1).max(120), email, password: z.string().min(8).max(256) })
  .openapi('RegisterBody')

const LoginBody = z.object({ email, password: z.string().min(1) }).openapi('LoginBody')
const VerifyBody = z.object({ email, code }).openapi('EmailVerifyBody')
const ResendBody = z.object({ email }).openapi('EmailResendBody')

const AuthData = z
  .object({ token: z.string(), user: User, created: z.boolean() })
  .openapi('AuthData')
const SentData = z.object({ sent: z.literal(true) }).openapi('SentData')

// False when the daily send budget is spent. The caller MUST propagate that: answering
// "sent" for a message that was never queued leaves no pending row, so the follow-up
// resend answers no_pending and registration is dead for the rest of the day with
// nothing reported anywhere.
async function issueCode(
  c: Context<AppEnv>,
  pending: { email: string; name: string; passwordHash: string },
): Promise<boolean> {
  const { db } = c.var
  if (!(await spend(db, 'email'))) return false

  const now = new Date()
  const code = generateCode()
  const row = { code, sentAt: now, expiresAt: new Date(now.getTime() + CODE_TTL_MS), attempts: 0 }

  await db
    .insert(emailVerifications)
    .values({ ...pending, ...row })
    .onConflictDoUpdate({ target: emailVerifications.email, set: { ...pending, ...row } })

  const owner = await db.select({ id: users.id }).from(users).where(eq(users.email, pending.email)).get()

  try {
    await email_verification(c.env, pending.email, code)
    await log(c, { event: 'verification.sent', channel: 'email', subject: pending.email, code, status: 'ok', userId: owner?.id ?? null })
  } catch (err) {
    console.error(`[auth] verification email failed for ${pending.email}:`, err)
    await refund(db, 'email')
    await log(c, { event: 'verification.sent', channel: 'email', subject: pending.email, code, status: 'failed', userId: owner?.id ?? null })
  }

  return true
}

// POST /api/auth/email/register
emailAuth.openapi(
  createRoute({
    hide: true,
    method: 'post',
    path: '/register',
    tags: ['Auth · Email'],
    summary: 'Start an email sign-up: sends a verification code',
    request: { body: json(RegisterBody) },
    responses: {
      200: res.ok(SentData, 'Code sent — call /verify to finish'),
      409: res.err('Email already registered'),
      429: res.err('Asked again too soon'),
    },
  }),
  async (c) => {
    const { name, email, password } = c.req.valid('json')
    const now = new Date()

    await c.var.db.delete(emailVerifications).where(lt(emailVerifications.expiresAt, now))

    const existing = await c.var.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .get()
    if (existing) return fail(c, 409, 'email_taken', 'This email is already registered.')

    const pending = await c.var.db
      .select({ sentAt: emailVerifications.sentAt })
      .from(emailVerifications)
      .where(eq(emailVerifications.email, email))
      .get()
    if (pending && now.getTime() - pending.sentAt.getTime() < RESEND_COOLDOWN_MS) {
      return fail(c, 429, 'too_soon', 'Please wait a minute before requesting another code.')
    }

    const sent = await issueCode(c, { email, name, passwordHash: await hashPassword(password) })
    if (!sent) return fail(c, 503, 'unavailable', 'Cannot send a code right now. Try again later.')
    return ok(c, { sent: true as const })
  },
)

// POST /api/auth/email/verify
emailAuth.openapi(
  createRoute({
    hide: true,
    method: 'post',
    path: '/verify',
    tags: ['Auth · Email'],
    summary: 'Verify the emailed code and create the account',
    request: { body: json(VerifyBody) },
    responses: {
      200: res.ok(AuthData, 'Account created, signed in'),
      400: res.err('Invalid or expired code'),
      409: res.err('Email already registered'),
    },
  }),
  async (c) => {
    const { email, code } = c.req.valid('json')

    const [live] = await c.var.db
      .update(emailVerifications)
      .set({ attempts: sql`${emailVerifications.attempts} + 1` })
      .where(
        and(
          eq(emailVerifications.email, email),
          lt(emailVerifications.attempts, MAX_CODE_ATTEMPTS),
          gt(emailVerifications.expiresAt, new Date()),
        ),
      )
      .returning()
    if (!live || !timingEq(live.code, code)) {
      return fail(c, 400, 'invalid_code', 'The code is invalid or has expired.')
    }

    await c.var.db.delete(emailVerifications).where(eq(emailVerifications.email, email))

    const [row] = await c.var.db
      .insert(users)
      .values({ name: live.name, email, passwordHash: live.passwordHash, emailVerified: true })
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id })
    if (!row) return fail(c, 409, 'email_taken', 'This email is already registered.')

    await log(c, { event: 'user.registered', subject: email, userId: row.id })

    const user = await findUser(c.var.db, row.id)
    return ok(c, {
      token: await createToken(c.env.JWT_SECRET, { id: row.id, name: live.name, email }),
      user,
      created: true,
    })
  },
)

// POST /api/auth/email/resend
emailAuth.openapi(
  createRoute({
    hide: true,
    method: 'post',
    path: '/resend',
    tags: ['Auth · Email'],
    summary: 'Resend the email verification code',
    request: { body: json(ResendBody) },
    responses: {
      200: res.ok(SentData, 'Code sent'),
      400: res.err('No sign-up is waiting for this address'),
      429: res.err('Asked again too soon'),
    },
  }),
  async (c) => {
    const { email } = c.req.valid('json')

    const pending = await c.var.db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.email, email))
      .get()
    if (!pending) return fail(c, 400, 'no_pending', 'Start the sign-up again to get a new code.')

    if (Date.now() - pending.sentAt.getTime() < RESEND_COOLDOWN_MS) {
      return fail(c, 429, 'too_soon', 'Please wait a minute before requesting another code.')
    }

    const sent = await issueCode(c, {
      email,
      name: pending.name,
      passwordHash: pending.passwordHash,
    })
    if (!sent) return fail(c, 503, 'unavailable', 'Cannot send a code right now. Try again later.')
    return ok(c, { sent: true as const })
  },
)

// POST /api/auth/email/login
emailAuth.openapi(
  createRoute({
    hide: true,
    method: 'post',
    path: '/login',
    tags: ['Auth · Email'],
    summary: 'Log in with email + password',
    request: { body: json(LoginBody) },
    responses: {
      200: res.ok(AuthData, 'Logged in'),
      401: res.err('Invalid credentials'),
    },
  }),
  async (c) => {
    const { email, password } = c.req.valid('json')

    const row = await c.var.db.select().from(users).where(eq(users.email, email)).get()
    const valid = await verifyPassword(password, row?.passwordHash ?? NO_SUCH_PASSWORD)
    if (!row?.passwordHash || !valid) {
      return fail(c, 401, 'invalid_credentials', 'Email or password is incorrect.')
    }

    await log(c, { event: 'user.signed_in', subject: email, userId: row.id })

    const user = await findUser(c.var.db, row.id)
    return ok(c, { token: await createToken(c.env.JWT_SECRET, row), user, created: false })
  },
)
