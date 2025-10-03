# @bloom/core

Framework-agnostic authentication core for Bloom, providing a complete authentication system with session management, password hashing, and extensible middleware support.

## Features

- Framework-agnostic authentication logic
- Argon2id password hashing with salt
- Session management with expiry and sliding window support
- Email verification and password reset flows
- Rate limiting with configurable windows
- Redis session storage support
- MongoDB database integration
- Type-safe error handling with structured error codes
- Pino structured logging with dev/production modes
- CORS support for cross-origin requests
- Extensible plugin system

## Installation

```bash
pnpm add @bloom/core
```

## Quick Start

### Next.js Setup

```typescript
import { createAuthHandler } from '@bloom/core/server/nextjs';
import { bloomAuth } from '@bloom/core';

const auth = bloomAuth({
  database: {
    uri: process.env.DATABASE_URL,
  },
  session: {
    secret: process.env.SESSION_SECRET,
    expiresIn: 7 * 24 * 60 * 60 * 1000,
    slidingWindow: true,
  },
  sessionStore: {
    type: 'redis',
    uri: process.env.REDIS_URL,
  },
});

const handler = createAuthHandler({ auth });

export const GET = handler.GET;
export const POST = handler.POST;
export const DELETE = handler.DELETE;
export const OPTIONS = handler.OPTIONS;
```

### Express Setup

```typescript
import { bloomServer } from '@bloom/core/server/express';

bloomServer({
  database: {
    uri: process.env.DATABASE_URL,
  },
  session: {
    secret: process.env.SESSION_SECRET,
  },
  sessionStore: {
    type: 'redis',
    uri: process.env.REDIS_URL,
  },
}).start();
```

## Configuration

### Session Configuration

```typescript
bloomAuth({
  session: {
    expiresIn: 7 * 24 * 60 * 60 * 1000,
    cookieName: 'bloom.sid',
    secret: process.env.SESSION_SECRET,
    slidingWindow: true,
  },
});
```

- `expiresIn`: Session expiry time in milliseconds (default: 7 days)
- `cookieName`: Cookie name for session storage (default: 'bloom.sid')
- `secret`: Secret key for session encryption (required)
- `slidingWindow`: Extend session on each request (default: false)

### CORS Configuration

```typescript
createAuthHandler({
  auth,
  cors: {
    origin: ['https://app.example.com', 'https://admin.example.com'],
    credentials: true,
  },
});
```

Disable CORS:

```typescript
createAuthHandler({
  auth,
  cors: false,
});
```

Allow all origins:

```typescript
createAuthHandler({
  auth,
  cors: {
    origin: '*',
    credentials: true,
  },
});
```

### Rate Limiting

```typescript
bloomAuth({
  rateLimit: {
    enabled: true,
    login: {
      max: 5,
      window: 15 * 60 * 1000,
    },
    registration: {
      max: 3,
      window: 60 * 60 * 1000,
    },
    passwordReset: {
      max: 3,
      window: 60 * 60 * 1000,
    },
  },
});
```

### Logging Configuration

```typescript
bloomAuth({
  logging: {
    level: 'info',
    enabled: true,
  },
});
```

Log levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`

### Callbacks

```typescript
import { logger } from '@bloom/core';

bloomAuth({
  callbacks: {
    onSignIn: async ({ user, session, ip }) => {
      logger.info({ userId: user.id, ip }, 'User signed in');
    },
    onSignOut: async ({ userId, ip }) => {
      logger.info({ userId, ip }, 'User signed out');
    },
    onRegister: async ({ user, session, ip }) => {
      logger.info({ userId: user.id, ip }, 'User registered');
    },
    onAccountDelete: async ({ userId, email, ip }) => {
      logger.warn({ userId, email, ip }, 'Account deleted');
    },
    onEmailVerify: async ({ userId, email, ip }) => {
      logger.info({ userId, email, ip }, 'Email verified');
    },
    onPasswordReset: async ({ userId, email, ip }) => {
      logger.info({ userId, email, ip }, 'Password reset');
    },
    onError: async ({ error, endpoint, userId, ip }) => {
      logger.error({ error, endpoint, userId, ip }, 'Auth error');
    },
    onRateLimit: async ({ ip, endpoint, limit, userId }) => {
      logger.warn({ ip, endpoint, limit, userId }, 'Rate limit exceeded');
    },
    onAuthEvent: async (ctx) => {
      logger.info({ action: ctx.action, email: ctx.email }, 'Auth event');
    },
  },
});
```

## API Routes

The following routes are automatically available:

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current session
- `DELETE /api/auth/account` - Delete account
- `POST /api/auth/email/verify` - Verify email
- `POST /api/auth/email/request-verification` - Request verification email
- `POST /api/auth/password/reset` - Reset password
- `POST /api/auth/password/request-reset` - Request password reset

## Error Codes

```typescript
enum APIErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_EMAIL = 'INVALID_EMAIL',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  RATE_LIMITED = 'RATE_LIMITED',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  TOKEN_REQUIRED = 'TOKEN_REQUIRED',
  PASSWORD_REQUIRED = 'PASSWORD_REQUIRED',
  ENDPOINT_NOT_FOUND = 'ENDPOINT_NOT_FOUND',
  INVALID_REQUEST = 'INVALID_REQUEST',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

## Server Components (Next.js)

```typescript
import { getSession } from '@bloom/core/server/nextjs';

export default async function Page() {
  const session = await getSession();

  if (!session) {
    return <div>Please sign in</div>;
  }

  return <div>Welcome, user {session.userId}</div>;
}
```

## Middleware Protection (Next.js)

```typescript
import { bloomMiddleware } from '@bloom/core/server/nextjs';

export default bloomMiddleware({
  protectedRoutes: ['/dashboard', '/settings'],
});
```

## Logging

```typescript
import { logger } from '@bloom/core';

logger.info('User action');
logger.warn({ userId: '123' }, 'Warning message');
logger.error({ error }, 'Error occurred');
```

Development mode: Pretty-printed colored logs
Production mode: Structured JSON logs

## Type Exports

```typescript
import type {
  BloomAuth,
  BloomAuthConfig,
  User,
  Session,
  SessionCookieData,
  BloomPlugin,
  AuthEventContext,
} from '@bloom/core';
```

## License

This project is licensed under the GNU Affero General Public License v3.0.
