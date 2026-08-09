// The local development database. Most commands only touch local; the two that
// can write to production are explicit about it with `--remote`. You almost
// never need these: the first-time `pnpm setup` runs `migrate` for you.
//
//   pnpm db migrate               bring the local dev db up to date with the code —
//                                 generate any schema changes, apply them, and load
//                                 the asset catalog. Run after you edit db/schema.ts.
//   pnpm db user <email> <pw>     create an email account (verified, role user). Add
//                                 --remote to create it in production instead.
//   pnpm db admin <email>         make a user an admin. Add --remote for production.
//   pnpm db pull                  REPLACE the local dev db with a copy of production
//                                 (schema from the migrations, data from production).
//                                 Only reads production; only local data is wiped.
//
// The commands that can write to production (a single INSERT / UPDATE each):
//   pnpm db user <email> <pw> --remote
//   pnpm db admin <email> --remote

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { webcrypto as crypto } from 'node:crypto'

const core = join(dirname(fileURLToPath(import.meta.url)), '..', 'core')
const DB = 'blokma-db'

const [cmd, ...rest] = process.argv.slice(2)
const remote = rest.includes('--remote') // honoured by `user` and `admin`
const positional = rest.filter((a) => !a.startsWith('--'))

const run = (command) => execSync(command, { cwd: core, stdio: 'inherit' })

// A JSON query against the target db; returns the `results` rows.
const query = (sql, target) =>
  JSON.parse(
    execSync(`npx wrangler d1 execute ${DB} ${target} --json --command "${sql}"`, {
      cwd: core,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }),
  )[0].results

// --- User creation: id + password hash must match what the app produces, since
// a raw INSERT bypasses the Worker (db/schema.ts newUserId, core.ts hashPassword). ---

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const newUserId = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  let id = ''
  for (const b of bytes) id += ALPHABET[b % 62]
  return id
}

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

// PBKDF2-HMAC-SHA256, 100k iterations, stored as `saltHex:hashHex` — the exact
// shape core.ts writes and verifyPassword reads.
const hashPassword = async (password) => {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' }, key, 256)
  return `${toHex(salt)}:${toHex(bits)}`
}

const commands = {
  // Everything needed to make the local dev db match the code, in order:
  // regenerate migrations from the schema, then apply them.
  migrate: () => {
    run('npx drizzle-kit generate')
    run(`npx wrangler d1 migrations apply ${DB} --local`)
  },
  // Copy production over the local dev db. Schema comes from the migrations (a
  // raw schema dump import fails: the export orders tables alphabetically, so
  // `holdings` is created before the `users` table its FK points at); only the
  // data is pulled from production. Local-only destruction — production is
  // never written to.
  pull: () => {
    const dump = join(core, '.wrangler', 'pull.sql')
    run(`npx wrangler d1 export ${DB} --remote --no-schema --output ${dump}`)
    run('rm -rf .wrangler/state/v3/d1')
    run(`npx wrangler d1 migrations apply ${DB} --local`)

    const query = (sql) =>
      JSON.parse(
        execSync(`npx wrangler d1 execute ${DB} --local --json --command "${sql}"`, {
          cwd: core,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }),
      )[0].results

    // The local schema (rebuilt from the migrations) can differ from production
    // two ways, and the raw dump trips on both: a table the schema dropped (its
    // INSERTs hit a missing table) and a *column* the schema dropped (its INSERTs
    // name a dead column, e.g. users.email_code after codes moved to their own
    // tables). Columns the schema *added* just aren't in the dump and take their
    // defaults. So read the local columns per table, drop dead-table rows, and
    // rewrite dead columns out of the rest. Internal tables (sqlite_*, _cf_*,
    // d1_migrations) are bookkeeping, not data — skip them and don't introspect
    // them (pragma on sqlite_* isn't even authorized).
    const internal = (t) => t.startsWith('sqlite_') || t.startsWith('_cf_') || t === 'd1_migrations'
    const tables = query("SELECT name FROM sqlite_master WHERE type='table'")
      .map((r) => r.name)
      .filter((t) => !internal(t))
    // Columns per table, one scoped pragma each. A single UNION over all tables
    // trips D1's "too many terms in compound SELECT" past a handful of tables, and
    // joining pragma over sqlite_master isn't authorized — so a small loop it is.
    const known = new Set(tables)
    const cols = new Map(
      tables.map((t) => [
        t,
        new Set(query(`SELECT name FROM pragma_table_info('${t}')`).map((r) => r.name)),
      ]),
    )

    // Split a VALUES tuple at top-level commas, keeping commas/parens inside
    // quoted strings (SQLite doubles an inner quote to escape it).
    const values = (s) => {
      const out = []
      let cur = '', str = false
      for (let i = 0; i < s.length; i++) {
        const ch = s[i]
        if (str) {
          cur += ch
          if (ch === "'") {
            if (s[i + 1] === "'") (cur += "'"), i++
            else str = false
          }
        } else if (ch === "'") (str = true), (cur += ch)
        else if (ch === ',') out.push(cur), (cur = '')
        else cur += ch
      }
      out.push(cur)
      return out
    }

    const droppedTables = new Set()
    const strippedCols = new Map()
    const data = readFileSync(dump, 'utf8')
      .split('\n')
      .map((line) => {
        const m = line.match(/^INSERT INTO "([^"]+)" \((.+?)\) VALUES\((.*)\);\s*$/)
        if (!m) return line // the defer-FK pragma, blank lines — keep verbatim
        const [, table, colList, valList] = m
        if (internal(table)) return null // incl. d1_migrations, whose UNIQUE(name) would collide
        if (!known.has(table)) return droppedTables.add(table), null

        const local = cols.get(table)
        const names = colList.split(',').map((c) => c.replace(/^"|"$/g, ''))
        const vals = values(valList)
        // Nothing to strip (or can't parse it) — leave the row so a real mismatch
        // fails loudly instead of being silently corrupted.
        if (!local || names.length !== vals.length || names.every((c) => local.has(c))) return line

        const keptN = [], keptV = []
        names.forEach((c, i) => {
          if (local.has(c)) keptN.push(`"${c}"`), keptV.push(vals[i])
          else {
            if (!strippedCols.has(table)) strippedCols.set(table, new Set())
            strippedCols.get(table).add(c)
          }
        })
        return `INSERT INTO "${table}" (${keptN.join(',')}) VALUES(${keptV.join(',')});`
      })
      .filter((line) => line !== null)
      .join('\n')
    writeFileSync(dump, data)
    run(`npx wrangler d1 execute ${DB} --local --file ${dump}`)
    rmSync(dump)

    for (const [t, c] of strippedCols)
      console.warn(
        `! Dropped column(s) ${[...c].join(', ')} from ${t} rows — production has them, ` +
          `the local schema no longer does.`,
      )
    if (droppedTables.size)
      console.warn(
        `! Skipped rows from ${[...droppedTables].join(', ')} — production still has these tables, ` +
          `the local schema doesn't. They land once \`pnpm deploy\` migrates production.`,
      )
    console.log('✓ Local dev db now mirrors production.')
  },
  // Create an email account directly, skipping the code step — the same shape
  // the register route writes, so the account can log in immediately. Email is
  // stored lowercased and marked verified; role is `user` (promote with `admin`).
  user: async () => {
    const email = positional[0]?.toLowerCase()
    const password = positional[1]
    if (!email || !password) throw new Error('usage: pnpm db user <email> <password> [--remote]')
    if (!email.includes('@')) throw new Error('enter a valid email address')
    if (password.length < 8) throw new Error('password must be at least 8 characters')

    const target = remote ? '--remote' : '--local'
    const where = remote ? 'remote' : 'local'
    const esc = (s) => s.replace(/'/g, "''") // SQL string literal escaping

    const existing = query(`SELECT id FROM users WHERE email='${esc(email)}'`, target)
    if (existing.length) {
      console.error(`✗ ${email} is already registered (${where}).`)
      process.exit(1)
    }

    const id = newUserId()
    const passwordHash = await hashPassword(password)
    const now = Math.floor(Date.now() / 1000) // created_at is a Unix-seconds timestamp

    query(
      `INSERT INTO users (id, email, password_hash, role, email_verified, phone_verified, kyc_status, created_at) ` +
        `VALUES ('${id}', '${esc(email)}', '${passwordHash}', 'user', 1, 0, 'unverified', ${now});`,
      target,
    )
    console.log(`✓ Created ${email} (${where}) — id ${id}, email verified, role user.`)
  },
  admin: () => {
    // Emails are stored lowercased (see the register route), so match that.
    const email = positional[0]?.toLowerCase()
    if (!email) throw new Error('usage: pnpm db admin <email> [--remote]')
    const target = remote ? '--remote' : '--local'
    const where = remote ? 'remote' : 'local'
    // RETURNING lets us tell a real promotion from a no-op (no such user).
    const out = execSync(
      `npx wrangler d1 execute ${DB} ${target} --json --command "UPDATE users SET role='admin' WHERE email='${email}' RETURNING id;"`,
      { cwd: core, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    )
    let hit
    try {
      hit = JSON.parse(out)[0]?.results?.length > 0
    } catch {
      hit = undefined // couldn't parse output — assume the UPDATE ran
    }
    if (hit === false) {
      console.error(`✗ no user found with "${email}" (${where}). Register that account first, then run this again.`)
      process.exit(1)
    }
    console.log(`✓ ${email} is now an admin (${where}). Log out and back in for the new token to take effect.`)
  },
}

const action = commands[cmd]
if (!action) {
  console.error(`Unknown db command: ${cmd ?? '(none)'}\nAvailable: ${Object.keys(commands).join(', ')}`)
  process.exit(1)
}

try {
  await action() // `user` is async (password hashing); the rest resolve immediately
} catch (err) {
  // Surface the reason. A thrown validation Error (usage, bad email) has no
  // `status`; without this its message was swallowed and the command just
  // exited silently, looking like it did nothing. A failed subprocess already
  // printed to the inherited stderr, so only add a line when there's a message.
  if (err?.message) console.error(`✗ ${err.message}`)
  process.exit(err.status ?? 1)
}
