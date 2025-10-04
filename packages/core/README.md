# @bloom/core

Framework-agnostic authentication core for Bloom, providing a complete authentication system with session management, password hashing, and server adapters for Express and Next.js.

## Features

- Argon2id password hashing with salt
- Session expiry and sliding window support
- Rate limiting with configurable windows
- Type-safe error handling with structured error codes
- Optional logger interface for custom logging
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

### Callbacks

```typescript
bloomAuth({
  callbacks: {
    onSignIn: async ({ user, session, ip }) => {
      console.log(`[SignIn] User ${user.id} from ${ip}`);
    },
    onSignOut: async ({ userId, ip }) => {
      console.log(`[SignOut] User ${userId} from ${ip}`);
    },
    onRegister: async ({ user, session, ip }) => {
      console.log(`[Register] User ${user.id} from ${ip}`);
    },
    onAccountDelete: async ({ userId, email, ip }) => {
      console.log(`[Delete] Account ${userId} (${email}) from ${ip}`);
    },
    onEmailVerify: async ({ userId, email, ip }) => {
      console.log(`[Verify] Email ${email} for user ${userId}`);
    },
    onPasswordReset: async ({ userId, email, ip }) => {
      console.log(`[Reset] Password for ${email}`);
    },
    onError: async ({ error, endpoint, userId, ip }) => {
      console.error(`[Error] ${endpoint}: ${error}`);
    },
    onRateLimit: async ({ ip, endpoint, limit, userId }) => {
      console.warn(`[RateLimit] ${endpoint} exceeded for ${ip}`);
    },
    onAuthEvent: async (ctx) => {
      console.log(`[Auth] ${ctx.action} - ${ctx.email || ctx.userId}`);
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

For Next.js specific utilities like getSession() and bloomMiddleware(), see the [@bloom/adapters package](../adapters) documentation.

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
