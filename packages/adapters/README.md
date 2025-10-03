# @bloom/adapters

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

## Session Type Declaration

Add session types to your Express app:

```typescript
declare module 'express-session' {
  interface SessionData {
    userId: string;
    sessionId: string;
  }
}
```

## Complete Express Example

```typescript
import express from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import { toExpressHandler, requireAuth } from '@bloom/adapters/express';
import { bloomAuth } from '@bloom/core';

const app = express();

const redisClient = createClient();
await redisClient.connect();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

const auth = bloomAuth({
  database: {
    uri: process.env.DATABASE_URL,
  },
  session: {
    secret: process.env.SESSION_SECRET,
  },
});

app.use('/api/auth', toExpressHandler(auth));

app.get('/api/protected', requireAuth(), (req, res) => {
  res.json({ message: 'Protected route', userId: req.session.userId });
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
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
