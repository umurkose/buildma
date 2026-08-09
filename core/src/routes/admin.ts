import { eq, and, ne, desc, gte, sum, avg, count, isNotNull } from 'drizzle-orm'
import { users, activityLog, dailyStats, pageStats, exports, EXPORT_KINDS, LOG_EVENTS, METRICS } from '@/db/schema'
import { createApp, createRoute, z, ok, fail, json, res, requireAuth, hashPassword, normalizeE164, log } from '@/core'
import { User, columns, toUser, findUser } from './user'

export const adminRoute = createApp()

// --- Guard (applied to every route in this file) ---

adminRoute.use('*', requireAuth, async (c, next) => {
  const actor = await c.var.db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, c.get('jwtPayload').sub))
    .get()
  // 404, not 403: the admin API does not admit it exists.
  if (actor?.role !== 'admin') return fail(c, 404, 'not_found', '404 Not Found')
  await next()
})

const hidden = { hide: true } as const

// --- Schemas ---

const email = z.string().trim().toLowerCase().pipe(z.email())

const idParam = z.object({ id: z.string().min(1) })
const RoleBody = z.object({ role: z.enum(['user', 'admin']) }).openapi('RoleBody')
const Deleted = z.object({ deleted: z.literal(true) }).openapi('Deleted')

const NewUserBody = z
  .discriminatedUnion('method', [
    z.object({
      method: z.literal('email'),
      name: z.string().trim().min(1).max(120),
      email,
      password: z.string().min(8).max(256),
      role: z.enum(['user', 'admin']).default('user'),
    }),
    z.object({
      method: z.literal('phone'),
      name: z.string().trim().min(1).max(120).optional(),
      phone: z.string().trim().min(1),
      role: z.enum(['user', 'admin']).default('user'),
    }),
  ])
  .openapi('NewUserBody')

const EditUserBody = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    email: email.optional(),
    phone: z.string().trim().min(1).nullable().optional(),
    role: z.enum(['user', 'admin']).optional(),
    emailVerified: z.boolean().optional(),
    phoneVerified: z.boolean().optional(),
  })
  .openapi('EditUserBody')

const auth = {
  401: res.err('Missing or invalid token'),
  403: res.err('Admin access required'),
} as const

// --- Routes ---

// GET /api/admin/users
adminRoute.openapi(
  createRoute({
    ...hidden,
    method: 'get',
    path: '/users',
    tags: ['Admin'],
    summary: 'List all users',
    security: [{ Bearer: [] }],
    responses: { 200: res.ok(z.array(User), 'All registered users'), ...auth },
  }),
  async (c) => ok(c, (await c.var.db.select(columns).from(users).all()).map(toUser)),
)

// POST /api/admin/users
adminRoute.openapi(
  createRoute({
    ...hidden,
    method: 'post',
    path: '/users',
    tags: ['Admin'],
    summary: 'Create a user',
    security: [{ Bearer: [] }],
    request: { body: json(NewUserBody) },
    responses: {
      201: res.ok(User, 'User created'),
      400: res.err('Invalid phone number'),
      ...auth,
      409: res.err('Email or phone already registered'),
    },
  }),
  async (c) => {
    const body = c.req.valid('json')

    let values: typeof users.$inferInsert
    let clash: { column: typeof users.email | typeof users.phone; value: string; code: string; message: string }

    if (body.method === 'email') {
      values = {
        name: body.name,
        email: body.email,
        passwordHash: await hashPassword(body.password),
        role: body.role,
      }
      clash = { column: users.email, value: body.email, code: 'email_taken', message: 'This email is already registered.' }
    } else {
      const phone = normalizeE164(body.phone)
      if (!phone) return fail(c, 400, 'invalid_phone', 'Enter a valid phone number in international format.')
      values = { name: body.name ?? null, phone, phoneVerified: true, role: body.role }
      clash = { column: users.phone, value: phone, code: 'phone_taken', message: 'This phone number is already registered.' }
    }

    const existing = await c.var.db
      .select({ id: users.id })
      .from(users)
      .where(eq(clash.column, clash.value))
      .get()
    if (existing) return fail(c, 409, clash.code, clash.message)

    const [created] = await c.var.db.insert(users).values(values).returning(columns)

    await log(c, {
      event: 'user.registered',
      subject: created.email ?? created.phone ?? created.id,
      userId: created.id,
    })

    return ok(c, toUser(created), 201)
  },
)

// GET /api/admin/users/{id}
adminRoute.openapi(
  createRoute({
    ...hidden,
    method: 'get',
    path: '/users/{id}',
    tags: ['Admin'],
    summary: 'Get a user by id',
    security: [{ Bearer: [] }],
    request: { params: idParam },
    responses: { 200: res.ok(User, 'The user'), ...auth, 404: res.err('User not found') },
  }),
  async (c) => {
    const user = await findUser(c.var.db, c.req.valid('param').id)
    if (!user) return fail(c, 404, 'not_found', 'User not found.')
    return ok(c, user)
  },
)

// PATCH /api/admin/users/{id}
adminRoute.openapi(
  createRoute({
    ...hidden,
    method: 'patch',
    path: '/users/{id}',
    tags: ['Admin'],
    summary: "Edit a user's profile",
    security: [{ Bearer: [] }],
    request: { params: idParam, body: json(EditUserBody) },
    responses: {
      200: res.ok(User, 'The updated user'),
      400: res.err('Cannot change your own role'),
      ...auth,
      404: res.err('User not found'),
      409: res.err('Email or phone already registered'),
    },
  }),
  async (c) => {
    const id = c.req.valid('param').id
    const patch = c.req.valid('json')

    if (patch.role && patch.role !== 'admin' && id === c.get('jwtPayload').sub)
      return fail(c, 400, 'self_role_change', 'You cannot change your own role.')

    for (const [column, value, code, message] of [
      [users.email, patch.email, 'email_taken', 'This email is already registered.'],
      [users.phone, patch.phone, 'phone_taken', 'This phone number is already registered.'],
    ] as const) {
      if (!value) continue
      const clash = await c.var.db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(column, value), ne(users.id, id)))
        .get()
      if (clash) return fail(c, 409, code, message)
    }

    const [updated] = await c.var.db.update(users).set(patch).where(eq(users.id, id)).returning(columns)
    if (!updated) return fail(c, 404, 'not_found', 'User not found.')

    return ok(c, toUser(updated))
  },
)

// PATCH /api/admin/users/{id}/role
adminRoute.openapi(
  createRoute({
    ...hidden,
    method: 'patch',
    path: '/users/{id}/role',
    tags: ['Admin'],
    summary: "Change a user's role",
    security: [{ Bearer: [] }],
    request: { params: idParam, body: json(RoleBody) },
    responses: {
      200: res.ok(User, 'The updated user'),
      400: res.err('Cannot change your own role'),
      ...auth,
      404: res.err('User not found'),
    },
  }),
  async (c) => {
    const id = c.req.valid('param').id
    const { role } = c.req.valid('json')
    if (id === c.get('jwtPayload').sub)
      return fail(c, 400, 'self_role_change', 'You cannot change your own role.')

    const [updated] = await c.var.db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning(columns)
    if (!updated) return fail(c, 404, 'not_found', 'User not found.')
    return ok(c, toUser(updated))
  },
)

// DELETE /api/admin/users/{id}
adminRoute.openapi(
  createRoute({
    ...hidden,
    method: 'delete',
    path: '/users/{id}',
    tags: ['Admin'],
    summary: 'Delete a user',
    security: [{ Bearer: [] }],
    request: { params: idParam },
    responses: {
      200: res.ok(Deleted, 'User deleted'),
      400: res.err('Cannot delete yourself'),
      ...auth,
      404: res.err('User not found'),
    },
  }),
  async (c) => {
    const id = c.req.valid('param').id
    if (id === c.get('jwtPayload').sub)
      return fail(c, 400, 'self_delete', 'You cannot delete your own account here.')

    const [removed] = await c.var.db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id })
    if (!removed) return fail(c, 404, 'not_found', 'User not found.')

    return ok(c, { deleted: true as const })
  },
)

// --- Activity log ---

const LogEntry = z
  .object({
    id: z.number(),
    userId: z.string().nullable(),
    event: z.enum(LOG_EVENTS),
    channel: z.enum(['sms', 'email']).nullable(),
    subject: z.string(),
    code: z.string().nullable(),
    detail: z.string().nullable(),
    payload: z.string().nullable(),
    status: z.enum(['ok', 'failed']),
    country: z.string().nullable(),
    userAgent: z.string().nullable(),
    createdAt: z.string(),
  })
  .openapi('LogEntry')

const LOG_LIMIT = 200

// GET /api/admin/logs
adminRoute.openapi(
  createRoute({
    ...hidden,
    method: 'get',
    path: '/logs',
    tags: ['Admin'],
    summary: 'Recent activity',
    security: [{ Bearer: [] }],
    responses: { 200: res.ok(z.array(LogEntry), 'The most recent events'), ...auth },
  }),
  async (c) =>
    ok(
      c,
      await c.var.db
        .select()
        .from(activityLog)
        .orderBy(desc(activityLog.id))
        .limit(LOG_LIMIT)
        .all(),
    ),
)

// GET /api/admin/logs/{id}
adminRoute.openapi(
  createRoute({
    ...hidden,
    method: 'get',
    path: '/logs/{id}',
    tags: ['Admin'],
    summary: 'One activity event',
    security: [{ Bearer: [] }],
    request: { params: z.object({ id: z.coerce.number().int() }) },
    responses: { 200: res.ok(LogEntry, 'The event'), ...auth, 404: res.err('Event not found') },
  }),
  async (c) => {
    const row = await c.var.db
      .select()
      .from(activityLog)
      .where(eq(activityLog.id, c.req.valid('param').id))
      .get()
    if (!row) return fail(c, 404, 'not_found', 'Event not found.')
    return ok(c, row)
  },
)

// GET /api/admin/users/{id}/logs
adminRoute.openapi(
  createRoute({
    ...hidden,
    method: 'get',
    path: '/users/{id}/logs',
    tags: ['Admin'],
    summary: "A user's recent activity",
    security: [{ Bearer: [] }],
    request: { params: idParam },
    responses: {
      200: res.ok(z.array(LogEntry), "The user's most recent events"),
      ...auth,
      404: res.err('User not found'),
    },
  }),
  async (c) => {
    const id = c.req.valid('param').id
    const user = await c.var.db.select({ id: users.id }).from(users).where(eq(users.id, id)).get()
    if (!user) return fail(c, 404, 'not_found', 'User not found.')

    return ok(
      c,
      await c.var.db
        .select()
        .from(activityLog)
        .where(eq(activityLog.userId, id))
        .orderBy(desc(activityLog.id))
        .limit(LOG_LIMIT)
        .all(),
    )
  },
)

// --- Stats ---

const Stats = z
  .object({
    days: z.number(),
    totals: z.record(z.enum(METRICS), z.number()),
    series: z.array(z.object({ day: z.string() }).catchall(z.number())),
    countries: z.array(z.object({ country: z.string(), count: z.number() })),
    pages: z.array(z.object({ path: z.string(), count: z.number() })),
    rating: z.object({ average: z.number(), votes: z.number() }),
  })
  .openapi('Stats')

const dayKey = (offset: number) =>
  new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10)

// GET /api/admin/stats
adminRoute.openapi(
  createRoute({
    ...hidden,
    method: 'get',
    path: '/stats',
    tags: ['Admin'],
    summary: 'Daily counters',
    security: [{ Bearer: [] }],
    request: { query: z.object({ days: z.coerce.number().int().min(1).max(90).default(30) }) },
    responses: { 200: res.ok(Stats, 'Counters for the window'), ...auth },
  }),
  async (c) => {
    const { days } = c.req.valid('query')
    const from = dayKey(days - 1)

    const [rows, pages, rating] = await Promise.all([
      c.var.db
        .select({
          day: dailyStats.day,
          metric: dailyStats.metric,
          country: dailyStats.country,
          count: dailyStats.count,
        })
        .from(dailyStats)
        .where(gte(dailyStats.day, from))
        .all(),
      c.var.db
        .select({ path: pageStats.path, count: sum(pageStats.count).mapWith(Number) })
        .from(pageStats)
        .where(gte(pageStats.day, from))
        .groupBy(pageStats.path)
        .orderBy(desc(sum(pageStats.count)))
        .all(),
      c.var.db
        .select({ average: avg(exports.rating).mapWith(Number), votes: count(exports.rating) })
        .from(exports)
        .where(isNotNull(exports.rating))
        .get(),
    ])

    const totals = Object.fromEntries(METRICS.map((m) => [m, 0])) as Record<string, number>
    const byDay = new Map<string, Record<string, number>>()
    const byCountry = new Map<string, number>()

    for (let i = days - 1; i >= 0; i--) {
      const day = dayKey(i)
      byDay.set(day, { day, ...Object.fromEntries(METRICS.map((m) => [m, 0])) } as never)
    }

    for (const row of rows) {
      totals[row.metric] += row.count
      const slot = byDay.get(row.day)
      if (slot) slot[row.metric] = (slot[row.metric] ?? 0) + row.count
      if (row.metric === 'visit')
        byCountry.set(row.country, (byCountry.get(row.country) ?? 0) + row.count)
    }

    return ok(c, {
      days,
      totals,
      series: [...byDay.values()],
      countries: [...byCountry.entries()]
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count),
      pages,
      rating: {
        average: rating?.votes ? Math.round((rating.average ?? 0) * 10) / 10 : 0,
        votes: rating?.votes ?? 0,
      },
    })
  },
)

// --- Exports ---

const ExportRow = z
  .object({
    id: z.string(),
    kind: z.enum(EXPORT_KINDS),
    country: z.string().nullable(),
    blocks: z.number(),
    blockTypes: z.string(),
    bytes: z.number(),
    rating: z.number().nullable(),
    createdAt: z.string(),
  })
  .openapi('ExportRow')

const ExportDetail = ExportRow.extend({ html: z.string() }).openapi('ExportDetail')

const EXPORT_LIMIT = 100

// GET /api/admin/exports
adminRoute.openapi(
  createRoute({
    ...hidden,
    method: 'get',
    path: '/exports',
    tags: ['Admin'],
    summary: 'Recent exported emails',
    security: [{ Bearer: [] }],
    responses: { 200: res.ok(z.array(ExportRow), 'Newest first'), ...auth },
  }),
  async (c) =>
    ok(
      c,
      await c.var.db
        .select({
          id: exports.id,
          kind: exports.kind,
          country: exports.country,
          blocks: exports.blocks,
          blockTypes: exports.blockTypes,
          bytes: exports.bytes,
          rating: exports.rating,
          createdAt: exports.createdAt,
        })
        .from(exports)
        .orderBy(desc(exports.createdAt))
        .limit(EXPORT_LIMIT)
        .all(),
    ),
)

// GET /api/admin/exports/{id}
adminRoute.openapi(
  createRoute({
    ...hidden,
    method: 'get',
    path: '/exports/{id}',
    tags: ['Admin'],
    summary: 'One exported email, with its HTML',
    security: [{ Bearer: [] }],
    request: { params: idParam },
    responses: { 200: res.ok(ExportDetail, 'The export'), ...auth, 404: res.err('Export not found') },
  }),
  async (c) => {
    const row = await c.var.db
      .select()
      .from(exports)
      .where(eq(exports.id, c.req.valid('param').id))
      .get()
    return row ? ok(c, row) : fail(c, 404, 'not_found', 'Export not found')
  },
)
