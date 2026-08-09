import { Hono, type Context } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'

// The public edge. Everything the internet can reach comes through here; core is
// private behind a service binding and never has a route of its own. So this is
// where the request is bounded and stamped, before it costs anything downstream.
//
// No CORS: the mobile app is a native client (CORS doesn't apply) and the web app
// calls its own origin, which proxies here server-side. Adding a permissive
// allowlist would only widen what a browser is permitted to do on a user's behalf.
//
// No rate limiting here either — that belongs at the edge, in Cloudflare's WAF and
// Rate Limiting rules, where a request is rejected before a Worker is billed for
// it. The application's own circuit breakers (notify/budget.ts, the verification
// attempt caps) bound the damage if it ever gets past.

const app = new Hono<{ Bindings: CloudflareBindings; Variables: { requestId: string } }>()

app.use(secureHeaders())
app.use(requestId())

app.get('/', (c) => c.text('gateway up'))

// Every API request is JSON and small. A cap means a multi-megabyte body is refused
// at the edge instead of being streamed into core.
//
// Only applied to requests that actually carry a body: without a Content-Length
// header Hono's bodyLimit reads `raw.body` directly, which is null on a GET, and
// throws.
const limit = bodyLimit({
  maxSize: 64 * 1024,
  onError: (c) =>
    c.json(
      { success: false, data: null, error: { code: 'payload_too_large', message: 'Request body is too large.' } },
      413,
    ),
})

app.use('/api/*', (c, next) => (c.req.raw.body ? limit(c, next) : next()))

// Forward to core over the service binding (Worker-to-Worker, no public hop),
// carrying the request id so one request can be followed across both workers' logs.
//
// The response is rebuilt rather than returned as-is: a service binding hands back
// a Response whose headers are immutable, and secureHeaders has to write to them.
const forward = async (c: Context<{ Bindings: CloudflareBindings; Variables: { requestId: string } }>) => {
  const req = new Request(c.req.raw)
  req.headers.set('X-Request-Id', c.get('requestId'))
  const res = await c.env.CORE.fetch(req)
  return new Response(res.body, res)
}

app.all('/api/*', forward)

// The Swagger UI (/docs) and OpenAPI spec (/doc) live on core. Forward them too so
// they're reachable from the edge — core still 404s them in production unless its
// DOCS var is on, so whether they're exposed is core's decision, not the gateway's.
app.get('/doc', forward)
app.get('/docs', forward)

export default app
