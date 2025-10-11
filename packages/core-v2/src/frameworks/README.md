# Bloom Core V2 - Framework Adapters

Framework-specific adapters for integrating Bloom Auth with your preferred backend framework.

## Available Adapters

- [Next.js](#nextjs) - App Router & Pages Router support
- [Express](#express) - Middleware and route handler

## Next.js

The Next.js adapter supports both App Router (Route Handlers) and Pages Router (API Routes).

### App Router (Route Handlers)

Route Handlers use Web Standard Request/Response, so integration is seamless:

```typescript
// app/api/auth/[...bloom]/route.ts
import { auth } from '@/lib/auth'
import { nextAdapter } from '@bloom/core-v2/frameworks/next'

const { GET, POST, DELETE } = nextAdapter(auth)
export { GET, POST, DELETE }
```

### Pages Router (API Routes)

For the Pages Router, the adapter converts Next.js req/res objects:

```typescript
// pages/api/auth/[...bloom].ts
import { auth } from '@/lib/auth'
import { nextAdapter } from '@bloom/core-v2/frameworks/next'

export default nextAdapter(auth).handler
```

### Server Actions

Use the API methods directly in Server Actions:

```typescript
'use server'
import { auth } from '@/lib/auth'
import { nextAdapter } from '@bloom/core-v2/frameworks/next'
import { headers } from 'next/headers'

export async function getUser() {
  const session = await nextAdapter(auth).api.getSession({
    headers: await headers()
  })

  return session?.user || null
}
```

### Server Components

Access session data in Server Components:

```typescript
import { auth } from '@/lib/auth'
import { nextAdapter } from '@bloom/core-v2/frameworks/next'
import { headers } from 'next/headers'

export default async function DashboardPage() {
  const session = await nextAdapter(auth).api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect('/login')
  }

  return <div>Welcome, {session.user.name}!</div>
}
```

## Express

The Express adapter converts Express req/res to Web Standard Request/Response.

### Middleware

Use as Express middleware for all auth routes:

```typescript
import express from 'express'
import { auth } from './auth'
import { expressAdapter } from '@bloom/core-v2/frameworks/express'

const app = express()

// Apply to all /auth/* routes
app.use('/auth/*', expressAdapter(auth))

app.listen(3000)
```

### Route Handler

Or use the handler for specific routes:

```typescript
import express from 'express'
import { auth } from './auth'
import { expressHandler } from '@bloom/core-v2/frameworks/express'

const app = express()
const handler = expressHandler(auth)

// Mount on specific routes
app.all('/auth/*', handler)
app.get('/auth/session', handler)
app.post('/auth/login', handler)
app.post('/auth/register', handler)

app.listen(3000)
```

### With Body Parser

Make sure to use JSON body parser before the auth middleware:

```typescript
import express from 'express'
import { auth } from './auth'
import { expressAdapter } from '@bloom/core-v2/frameworks/express'

const app = express()

// Body parser MUST come before auth middleware
app.use(express.json())
app.use('/auth/*', expressAdapter(auth))

app.listen(3000)
```

### Access Session in Routes

Use the API methods to access session data in your Express routes:

```typescript
import { auth } from './auth'

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

Bloom uses Web Standard Request/Response, so it works with any framework that supports these standards:

- **Hono**: Use `auth.handler` directly
- **Fastify**: Use `@fastify/middie` to wrap `auth.handler`
- **Astro**: Use `auth.handler` in API routes
- **SvelteKit**: Use `auth.handler` in `+server.ts` files
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

export default app
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

## License

This project is licensed under the GNU Affero General Public License v3.0.
