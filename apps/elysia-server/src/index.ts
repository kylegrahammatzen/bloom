import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { toElysiaHandler } from '@bloom/adapters/elysia'
import { auth } from './lib/auth'

const PORT = Number(process.env.PORT) || 5004
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000'

const app = new Elysia()
  .use(cors({
    origin: CORS_ORIGIN,
    credentials: true,
  }))
  .all('/auth/*', toElysiaHandler({ auth }))
  .listen(PORT)

console.log(`[Server] Running on http://localhost:${app.server?.port}`)
console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`)
