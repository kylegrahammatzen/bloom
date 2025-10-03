# @bloom/core

Framework-agnostic authentication core for Bloom, providing a complete authentication system with session management, password hashing, and server adapters for Express and Next.js.

## Features

- Argon2id password hashing with salt
- Session expiry and sliding window support
- Rate limiting with configurable windows
- Type-safe error handling with structured error codes
- Pino structured logging with dev/production modes
- CORS configuration for cross-origin requests

## Installation

```bash
pnpm add @bloom/core
```

## Quick Start

See the example apps for complete setup:

- [Next.js 15](../../apps/next15) - App Router with server components
- [Express Server](../../apps/express-server) - Standalone authentication server
- [React Router v7](../../apps/react-router-v7) - Client-side React with Express backend

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

- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /logout` - Logout user
- `GET /me` - Get current session
- `DELETE /account` - Delete account
- `POST /email/verify` - Verify email
- `POST /email/request-verification` - Request verification email
- `POST /password/reset` - Reset password
- `POST /password/request-reset` - Request password reset

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

## Next.js Server Utilities

### Get Session in Server Components

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

### Middleware Protection

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
