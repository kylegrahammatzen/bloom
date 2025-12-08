# @bloom/adapters

Framework adapters for Bloom Auth.

## Installation

```bash
bun add @bloom/adapters @bloom/core
```

## Next.js

### App Router (Route Handlers)

```typescript
// app/api/auth/[...bloom]/route.ts
import { auth } from '@/lib/auth'
import { toNextJsHandler } from '@bloom/adapters/next'

export const { GET, POST, DELETE, OPTIONS } = toNextJsHandler({ auth })
```

### Server Actions

Use `auth.api` directly in Server Actions:

```typescript
'use server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  return session?.user || null
}
```

### Server Components

```typescript
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect('/login')
  }

  return <div>Welcome, {session.user.name}!</div>
}
```

## Express

```typescript
import express from 'express'
import { auth } from './auth'
import { toExpressHandler } from '@bloom/adapters/express'

const app = express()

// Body parser MUST come before auth middleware
app.use(express.json())
app.use('/auth/*', toExpressHandler({ auth }))

app.listen(3000)
```

### Access Session in Express Routes

```typescript
app.get('/dashboard', async (req, res) => {
  const session = await auth.api.getSession({
    headers: req.headers
  })

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  res.json({ user: session.user })
})
```

## Elysia

```typescript
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { toElysiaHandler } from '@bloom/adapters/elysia'
import { auth } from './auth'

new Elysia()
  .use(cors({ origin: 'http://localhost:3000', credentials: true }))
  .all('/auth/*', toElysiaHandler({ auth }))
  .listen(5004)
```

## Other Frameworks

Bloom uses Web Standard Request/Response, so it works with any framework that supports these standards:

- **Hono**: Use `auth.handler` directly
- **SvelteKit**: Use `auth.handler` in `+server.ts` files
- **Astro**: Use `auth.handler` in API routes
- **Fastify**: Create adapter similar to Express
- **Remix**: Use `auth.handler` in route modules
- **Bun.serve()**: Use `auth.handler` directly

### Example: Hono

```typescript
import { Hono } from 'hono'
import { auth } from './auth'

const app = new Hono()

app.all('/auth/*', async (c) => {
  const response = await auth.handler(c.req.raw)
  return response
})
```

### Example: SvelteKit

```typescript
// src/routes/auth/[...bloom]/+server.ts
import { auth } from '$lib/auth'

export async function GET({ request }: { request: Request }) {
  return await auth.handler(request)
}

export async function POST({ request }: { request: Request }) {
  return await auth.handler(request)
}

export async function DELETE({ request }: { request: Request }) {
  return await auth.handler(request)
}
```

### Example: Bun.serve()

```typescript
import { auth } from './auth'

Bun.serve({
  port: 5003,
  async fetch(request) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/auth/')) {
      return auth.handler(request)
    }
    return new Response('Not Found', { status: 404 })
  }
})
```

## TypeScript

This package exports only adapter functions, not types. For TypeScript types, import from `@bloom/core`:

```typescript
import type { BloomAuth, User, Session } from '@bloom/core'
import { toNextJsHandler } from '@bloom/adapters/next'

const auth: BloomAuth = bloomAuth({ /* ... */ })
export const { GET, POST } = toNextJsHandler({ auth })
```

## License

GNU Affero General Public License v3.0
