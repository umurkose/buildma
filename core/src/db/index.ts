import { drizzle } from 'drizzle-orm/d1'
import { createMiddleware } from 'hono/factory'
import * as schema from './schema'

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema })
}

export type DB = ReturnType<typeof createDb>

export const dbMiddleware = createMiddleware<{
  Bindings: CloudflareBindings
  Variables: { db: DB }
}>(async (c, next) => {
  c.set('db', createDb(c.env.DB))
  await next()
})
