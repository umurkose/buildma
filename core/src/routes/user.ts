import { eq } from 'drizzle-orm'
import { users } from '@/db/schema'
import type { DB } from '@/db'
import { createApp, createRoute, z, ok, fail, res, requireAuth, DIAL_CODES } from '@/core'

export const userRoute = createApp()

// --- Schema ---

export const User = z
  .object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.email().nullable(),
    phone: z.string().nullable(),
    role: z.enum(['user', 'admin']),
    verification: z.object({
      email: z.boolean(),
      phone: z.boolean(),
    }),
    createdAt: z.string(),
  })
  .openapi('User')

export const columns = {
  id: users.id,
  name: users.name,
  email: users.email,
  phone: users.phone,
  role: users.role,
  emailVerified: users.emailVerified,
  phoneVerified: users.phoneVerified,
  createdAt: users.createdAt,
}

export const toUser = <T extends { emailVerified: boolean; phoneVerified: boolean }>({
  emailVerified,
  phoneVerified,
  ...user
}: T) => ({ ...user, verification: { email: emailVerified, phone: phoneVerified } })

export const findUser = async (db: DB, id: string) => {
  const row = await db.select(columns).from(users).where(eq(users.id, id)).get()
  return row && toUser(row)
}

const maskPhone = (phone: string | null) => {
  if (!phone) return phone
  const digits = phone.startsWith('+') ? phone.slice(1) : phone
  let dial = ''
  for (let n = Math.min(4, digits.length - 2); n > 0 && !dial; n--)
    if (DIAL_CODES.has(digits.slice(0, n))) dial = digits.slice(0, n)
  const visible = (phone.startsWith('+') ? '+' : '') + dial
  return visible + '*'.repeat(Math.max(phone.length - visible.length - 2, 0)) + phone.slice(-2)
}

const maskEmail = (email: string | null) => {
  if (!email) return email
  const at = email.lastIndexOf('@')
  if (at <= 0) return email
  const mask = (s: string) => s[0] + '*'.repeat(Math.max(s.length - 1, 1))
  const domain = email.slice(at + 1)
  const dot = domain.lastIndexOf('.')
  const maskedDomain = dot > 0 ? mask(domain.slice(0, dot)) + domain.slice(dot) : mask(domain)
  return `${mask(email.slice(0, at))}@${maskedDomain}`
}

// --- Routes ---

const Me = User.omit({ id: true })
  .extend({ email: z.string().nullable() })
  .openapi('Me')

// GET /api/user
userRoute.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['User'],
    summary: 'Get the current user',
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    responses: {
      200: res.ok(Me, 'The current user'),
      401: res.err('Missing or invalid token'),
      404: res.err('User not found'),
    },
  }),
  async (c) => {
    const user = await findUser(c.var.db, c.get('jwtPayload').sub)
    if (!user) return fail(c, 404, 'not_found', 'User not found.')
    const { id: _id, ...me } = user
    return ok(c, { ...me, email: maskEmail(me.email), phone: maskPhone(me.phone) })
  },
)
