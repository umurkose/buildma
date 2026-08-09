import { sqliteTable, text, integer, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core'

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
export const newId = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  let id = ''
  for (const byte of bytes) id += ALPHABET[byte % 62]
  return id
}


export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(newId),

  name: text('name'),
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  phone: text('phone').unique(),

  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),

  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  phoneVerified: integer('phone_verified', { mode: 'boolean' }).notNull().default(false),

  kycId: text('kyc_id'),
  kycWorkflowId: text('kyc_workflow_id'),
  kycStatus: text('kyc_status', { enum: ['unverified', 'pending', 'approved', 'rejected'] })
    .notNull()
    .default('unverified'),
  kycUpdatedAt: integer('kyc_updated_at', { mode: 'timestamp' }),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const notifyBudget = sqliteTable(
  'notify_budget',
  {
    day: text('day').notNull(),
    channel: text('channel', { enum: ['sms', 'email'] }).notNull(),
    count: integer('count').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.day, t.channel] })],
)

export const LOG_EVENTS = [
  'verification.sent',
  'user.registered',
  'user.signed_in',
  'user.signed_out',
] as const

export type LogEvent = (typeof LOG_EVENTS)[number]

export const activityLog = sqliteTable(
  'activity_log',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id'),
    event: text('event', { enum: LOG_EVENTS }).notNull(),
    channel: text('channel', { enum: ['sms', 'email'] }),
    subject: text('subject').notNull(),
    code: text('code'),
    detail: text('detail'),
    payload: text('payload'),
    status: text('status', { enum: ['ok', 'failed'] }).notNull(),
    country: text('country'),
    userAgent: text('user_agent'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index('activity_log_created_at').on(t.createdAt),
    index('activity_log_user').on(t.userId, t.id),
  ],
)

export const emailVerifications = sqliteTable('email_verifications', {
  email: text('email').primaryKey(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  code: text('code').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  sentAt: integer('sent_at', { mode: 'timestamp' }).notNull(),
  attempts: integer('attempts').notNull().default(0),
})

export const phoneVerifications = sqliteTable('phone_verifications', {
  phone: text('phone').primaryKey(),
  code: text('code').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  sentAt: integer('sent_at', { mode: 'timestamp' }).notNull(),
  attempts: integer('attempts').notNull().default(0),
})

export const assets = sqliteTable('assets', {
  symbol: text('symbol').primaryKey(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const holdings = sqliteTable(
  'holdings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    symbol: text('symbol')
      .notNull()
      .references(() => assets.symbol, { onDelete: 'cascade' }),
    amount: text('amount').notNull().default('0'),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex('holdings_user_symbol_unq').on(t.userId, t.symbol)],
)

// --- Daily counters ---

export const METRICS = ['visit', 'download', 'copy', 'signup', 'login'] as const
export type Metric = (typeof METRICS)[number]

export const dailyStats = sqliteTable(
  'daily_stats',
  {
    day: text('day').notNull(),
    metric: text('metric', { enum: METRICS }).notNull(),
    country: text('country').notNull().default('XX'),
    count: integer('count').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.day, t.metric, t.country] })],
)

// --- Page views ---

export const pageStats = sqliteTable(
  'page_stats',
  {
    day: text('day').notNull(),
    path: text('path').notNull(),
    count: integer('count').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.day, t.path] })],
)

// --- Exports ---

export const EXPORT_KINDS = ['download', 'copy'] as const

export const exports = sqliteTable(
  'exports',
  {
    id: text('id').primaryKey().$defaultFn(newId),
    kind: text('kind', { enum: EXPORT_KINDS }).notNull(),
    country: text('country'),
    blocks: integer('blocks').notNull().default(0),
    blockTypes: text('block_types').notNull().default(''),
    bytes: integer('bytes').notNull().default(0),
    rating: integer('rating'),
    html: text('html').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('exports_created_at').on(t.createdAt)],
)
