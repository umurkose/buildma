import { createApp, createRoute, z, ok, res, requireAuth, log } from '@/core'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { emailAuth } from './email'

export const authRoute = createApp()

authRoute.route('/email', emailAuth)

// --- Sign out ---

// POST /api/auth/logout
authRoute.openapi(
  createRoute({
    hide: true,
    method: 'post',
    path: '/logout',
    tags: ['Auth'],
    summary: 'Record a sign-out',
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    responses: { 200: res.ok(z.object({ ok: z.literal(true) }), 'Recorded') },
  }),
  async (c) => {
    const id = c.get('jwtPayload').sub
    const row = await c.var.db.select({ email: users.email }).from(users).where(eq(users.id, id)).get()
    await log(c, { event: 'user.signed_out', subject: row?.email ?? id, userId: id })
    return ok(c, { ok: true } as const)
  },
)
