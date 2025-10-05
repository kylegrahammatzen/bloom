# @bloom/core

Framework-agnostic authentication core for Bloom, providing a complete authentication system with session management, password hashing, and server adapters for Express and Next.js.

## Features

- Argon2id password hashing with salt
- Session expiry and sliding window support
- Rate limiting with configurable windows
- Extensible via plugins
- Type-safe error handling with structured error codes
- Optional logger interface for custom logging
- CORS configuration for cross-origin requests

## Installation

```bash
pnpm add @bloom/core
```

## Documentation

- [Plugins](#plugins) - Extend Bloom with custom functionality
- [Configuration](#configuration) - Session, CORS, rate limiting, and logging
- [Callbacks](#callbacks) - Hook into authentication events
- [API Routes](#api-routes) - Available HTTP endpoints
- [Error Codes](#error-codes) - Structured error handling

## Plugins

Extend Bloom with plugins for additional functionality:

```typescript
import { bloomAuth, sessions } from '@bloom/core';

const auth = bloomAuth({
  plugins: [sessions()],
});
```

See the [plugin documentation](./src/plugins) for available plugins and how to build custom ones.

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

### Logger Configuration

```typescript
import { bloomAuth, createLogger } from '@bloom/core';

// Use default logger
bloomAuth({
  logger: createLogger(),
});

// Custom configuration
bloomAuth({
  logger: createLogger({
    level: 'debug',
    prefix: '[My App Auth]',
    colors: true,
  }),
});

// Disable logging
bloomAuth({
  logger: { disabled: true },
});

// Provide your own logger (winston, pino, etc)
bloomAuth({
  logger: myCustomLogger,
});
```

### Callbacks

```typescript
import { createLogger } from '@bloom/core';

const logger = createLogger({ level: 'info' });

bloomAuth({
  logger,
  callbacks: {
    onSignIn: async ({ user, session, ip }) => {
      logger.info('User signed in', { userId: user.id, ip });
    },
    onSignOut: async ({ userId, ip }) => {
      logger.info('User signed out', { userId, ip });
    },
    onRegister: async ({ user, session, ip }) => {
      logger.info('User registered', { userId: user.id, ip });
    },
    onAccountDelete: async ({ userId, email, ip }) => {
      logger.warn('Account deleted', { userId, email, ip });
    },
    onEmailVerify: async ({ userId, email, ip }) => {
      logger.info('Email verified', { userId, email });
    },
    onPasswordReset: async ({ userId, email, ip }) => {
      logger.info('Password reset', { email });
    },
    onError: async ({ error, endpoint, userId, ip }) => {
      logger.error('Auth error', { endpoint, error, userId, ip });
    },
    onRateLimit: async ({ ip, endpoint, limit, userId }) => {
      logger.warn('Rate limit exceeded', { endpoint, ip, limit });
    },
    onAuthEvent: async (ctx) => {
      logger.info('Auth event', { action: ctx.action, email: ctx.email, userId: ctx.userId });
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

Additional routes may be added by [plugins](./src/plugins).

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
