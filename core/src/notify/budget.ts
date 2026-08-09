import { and, eq, lt, sql } from 'drizzle-orm'
import { notifyBudget } from '@/db/schema'
import type { DB } from '@/db'
import { today } from '@/core'

export const NOTIFY_CAPS = {
  email: 2000,
} as const

export type Channel = keyof typeof NOTIFY_CAPS


export async function spend(db: DB, channel: Channel): Promise<boolean> {
  const [row] = await db
    .insert(notifyBudget)
    .values({ day: today(), channel, count: 1 })
    .onConflictDoUpdate({
      target: [notifyBudget.day, notifyBudget.channel],
      set: { count: sql`${notifyBudget.count} + 1` },
      setWhere: lt(notifyBudget.count, NOTIFY_CAPS[channel]),
    })
    .returning()
  return !!row
}

export async function refund(db: DB, channel: Channel) {
  await db
    .update(notifyBudget)
    .set({ count: sql`${notifyBudget.count} - 1` })
    .where(and(eq(notifyBudget.day, today()), eq(notifyBudget.channel, channel), sql`${notifyBudget.count} > 0`))
}
