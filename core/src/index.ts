import { swaggerUI } from '@hono/swagger-ui'
import { createMiddleware } from 'hono/factory'
import { dbMiddleware } from '@/db'
import { api } from '@/routes'
import { createApp, type AppEnv } from '@/core'

const app = createApp()

app.get('/', (c) => c.text('core up'))

app.use('/api/*', dbMiddleware)
app.route('/api', api)

const docsGate = createMiddleware<AppEnv>(async (c, next) => {
  if (c.env.ENVIRONMENT === 'production' && c.env.DOCS !== 'true') return c.notFound()
  await next()
})
app.use('/doc', docsGate)
app.use('/docs', docsGate)

app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
})
app.doc('/doc', { openapi: '3.0.0', info: { title: 'Core API', version: '1.0.0' } })
app.get('/docs', swaggerUI({ url: '/doc' }))

export default app
