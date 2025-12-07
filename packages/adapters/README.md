# @bloom/adapters-v2

Framework adapters for Bloom Auth V2.

## Installation

```bash
pnpm add @bloom/adapters-v2 @bloom/core-v2
```

## Next.js

### App Router (Route Handlers)

```typescript
// app/api/auth/[...bloom]/route.ts
import { auth } from '@/lib/auth'
import { toNextJsHandler } from '@bloom/adapters-v2/next'

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
import { toExpressHandler } from '@bloom/adapters-v2/express'

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

## Other Frameworks

Bloom V2 uses Web Standard Request/Response, so it works with any framework that supports these standards:

- **Hono**: Use `auth.handler` directly
- **SvelteKit**: Use `auth.handler` in `+server.ts` files
- **Astro**: Use `auth.handler` in API routes
- **Fastify**: Create adapter similar to Express
- **Remix**: Use `auth.handler` in route modules

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

## TypeScript

This package exports only adapter functions, not types. For TypeScript types, import from `@bloom/core-v2`:

```typescript
import type { BloomAuth, User, Session } from '@bloom/core-v2'
import { toNextJsHandler } from '@bloom/adapters-v2/next'

const auth: BloomAuth = bloomAuth({ /* ... */ })
export const { GET, POST } = toNextJsHandler({ auth })
```

## License

GNU Affero General Public License v3.0
