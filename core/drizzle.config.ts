import { defineConfig } from 'drizzle-kit'

// SQLite dialect = D1. `drizzle-kit generate` writes SQL to `out`; Wrangler
// applies it to D1 (see `migrations_dir` in wrangler.jsonc).
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
})
