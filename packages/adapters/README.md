<img src="../../.github/banner.png" width="100%" alt="Bloom Banner" />

# Bloom - Adapters

Framework adapters for Bloom authentication, providing middleware and handlers for popular web frameworks.

## Features

- Express middleware adapter
- Type-safe request handling
- Automatic session management
- Framework-agnostic core integration

## Installation

```bash
pnpm add @bloom/adapters @bloom/core
```

## Express Adapter

### Router Handler

Create a dedicated auth router:

```typescript
import express from 'express';
import { toExpressHandler } from '@bloom/adapters/express';
import { bloomAuth } from '@bloom/core';

const app = express();

const auth = bloomAuth({
  database: {
    uri: process.env.DATABASE_URL,
  },
  session: {
    secret: process.env.SESSION_SECRET,
  },
});

app.use('/api/auth', toExpressHandler(auth));

app.listen(5000);
```

### Middleware Handler

Use as middleware for specific routes:

```typescript
import { createExpressHandler } from '@bloom/adapters/express';

const authHandler = createExpressHandler(auth);

app.post('/api/auth/login', authHandler);
app.post('/api/auth/register', authHandler);
app.get('/api/auth/me', authHandler);
```

### Require Authentication

Protect routes with authentication middleware:

```typescript
import { requireAuth } from '@bloom/adapters/express';

app.get('/api/protected', requireAuth(), (req, res) => {
  res.json({ userId: req.session.userId });
});
```

## Complete Express Example

See the [Express Server example app](../../apps/express-server) for a complete implementation.

## Next.js Adapter

### API Route Handler

Create authentication API routes with the Next.js App Router:

```typescript
import { createAuthHandler } from '@bloom/adapters/nextjs';
import { bloomAuth } from '@bloom/core';
import { connectDB } from '@/lib/db';

const auth = bloomAuth({
  database: {
    uri: process.env.DATABASE_URL,
  },
  session: {
    secret: process.env.SESSION_SECRET,
    expiresIn: 7 * 24 * 60 * 60 * 1000,
  },
});

const handler = createAuthHandler({ auth, connectDB });

export const GET = handler.GET;
export const POST = handler.POST;
export const DELETE = handler.DELETE;
export const OPTIONS = handler.OPTIONS;
```

### Server-Side Session Validation

Get validated session in Server Components:

```typescript
import { getSession } from '@bloom/adapters/nextjs/server';

export default async function Page() {
  const session = await getSession();

  if (!session) {
    return <div>Please sign in</div>;
  }

  return <div>Welcome, {session.user.email}</div>;
}
```

### Middleware Protection

Protect routes with middleware:

```typescript
import { bloomMiddleware } from '@bloom/adapters/nextjs/middleware';

export default bloomMiddleware({
  protectedRoutes: ['/dashboard', '/settings'],
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

### CORS Configuration

```typescript
const handler = createAuthHandler({
  auth,
  connectDB,
  cors: {
    origin: ['https://app.example.com'],
    credentials: true,
  },
});
```

## API Routes

The Express adapter automatically provides these routes when using `toExpressHandler`:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `DELETE /api/auth/account`
- `POST /api/auth/email/verify`
- `POST /api/auth/email/request-verification`
- `POST /api/auth/password/reset`
- `POST /api/auth/password/request-reset`

## Error Handling

The adapter automatically converts Bloom errors to Express responses:

```typescript
import { APIError, APIErrorCode } from '@bloom/core';

app.use((err, req, res, next) => {
  if (err instanceof APIError) {
    const response = err.toResponse();
    return res.status(response.status).json(response.body);
  }

  res.status(500).json({ error: { message: 'Internal server error' } });
});
```

## Type Exports

```typescript
import type {
  BloomAuth,
  BloomHandlerContext,
} from '@bloom/adapters/express';
```

## License

This project is licensed under the GNU Affero General Public License v3.0.
