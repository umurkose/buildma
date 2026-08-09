import { createApp, createRoute, z, ok, res, json, bump, bumpPage } from '@/core'

// --- Anonymous counters ---

const TRACKED = ['visit', 'download', 'copy'] as const

const PATHS = ['/', '/editor', '/auth/login', '/auth/signup', '/auth/verify', '/app'] as const

const normalizePath = (input: string) => {
  const path = input.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/'
  if (PATHS.includes(path as (typeof PATHS)[number])) return path
  if (path.startsWith('/app')) return '/app'
  return 'other'
}

export const trackRoute = createApp()

// POST /api/track
trackRoute.openapi(
  createRoute({
    hide: true,
    method: 'post',
    path: '/',
    tags: ['Track'],
    summary: 'Record an anonymous event',
    request: {
      body: json(
        z.object({
          metric: z.enum(TRACKED).optional(),
          path: z.string().max(512).optional(),
        }),
      ),
    },
    responses: { 200: res.ok(z.object({ ok: z.literal(true) }), 'Counted') },
  }),
  async (c) => {
    const { metric, path } = c.req.valid('json')
    if (metric) bump(c, metric)
    if (path) bumpPage(c, normalizePath(path))
    return ok(c, { ok: true } as const)
  },
)
