import { and, desc, eq, isNull, lt, lte } from 'drizzle-orm'
import { exports, EXPORT_KINDS, newId } from '@/db/schema'
import { createApp, createRoute, z, ok, res, json, after, bump } from '@/core'

// --- Exported emails ---

const TTL_DAYS = 30
const MAX_BYTES = 48 * 1024
// A COUNT cap as well as an age cap. Age alone bounds nothing: this endpoint is
// unauthenticated and unthrottled, so one machine can write 48KB rows for 30 days
// before anything expires. 500 rows is 24MB worst case, and nobody reads past the
// 100 the admin list shows.
const MAX_ROWS = 500

export const exportRoute = createApp()

// POST /api/exports
exportRoute.openapi(
  createRoute({
    hide: true,
    method: 'post',
    path: '/',
    tags: ['Track'],
    summary: 'Record an exported email',
    request: {
      body: json(
        z.object({
          kind: z.enum(EXPORT_KINDS),
          html: z.string().max(MAX_BYTES),
          blocks: z.number().int().min(0).max(500).default(0),
          blockTypes: z.string().max(2000).default(''),
          rating: z.number().int().min(1).max(5).nullish(),
        }),
      ),
    },
    responses: { 200: res.ok(z.object({ id: z.string() }), 'Recorded') },
  }),
  async (c) => {
    const { kind, html, blocks, blockTypes, rating } = c.req.valid('json')
    bump(c, kind)

    const id = newId()

    try {
      await c.var.db.insert(exports).values({
        id,
        kind,
        country: c.req.header('cf-ipcountry') ?? null,
        blocks,
        blockTypes,
        bytes: new TextEncoder().encode(html).length,
        rating: rating ?? null,
        html,
      })
      const cutoff = new Date(Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000)
      after(
        c,
        (async () => {
          await c.var.db.delete(exports).where(lt(exports.createdAt, cutoff))
          // Anything past MAX_ROWS by recency. One indexed read of a single id, then
          // one ranged delete — not a scan.
          const edge = await c.var.db
            .select({ createdAt: exports.createdAt })
            .from(exports)
            .orderBy(desc(exports.createdAt))
            .limit(1)
            .offset(MAX_ROWS)
            .get()
          if (edge) await c.var.db.delete(exports).where(lte(exports.createdAt, edge.createdAt))
        })(),
      )
    } catch (err) {
      console.error('[exports] could not store', err)
    }

    return ok(c, { id })
  },
)

// PATCH /api/exports/{id}
exportRoute.openapi(
  createRoute({
    hide: true,
    method: 'patch',
    path: '/{id}',
    tags: ['Track'],
    summary: 'Rate an exported email',
    request: {
      params: z.object({ id: z.string().min(1).max(32) }),
      body: json(z.object({ rating: z.number().int().min(1).max(5) })),
    },
    responses: { 200: res.ok(z.object({ ok: z.literal(true) }), 'Rated') },
  }),
  async (c) => {
    // Only while still unrated, so an id cannot be used to move a score around.
    await c.var.db
      .update(exports)
      .set({ rating: c.req.valid('json').rating })
      .where(and(eq(exports.id, c.req.valid('param').id), isNull(exports.rating)))
    return ok(c, { ok: true } as const)
  },
)
