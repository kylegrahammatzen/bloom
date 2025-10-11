<p align="center">
  <img width="600" src="../../.github/banner.png" alt="Bloom Banner">
</p>
<br/>
<p align="center">
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-20-green.svg" alt="Node.js"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-blue.svg" alt="TypeScript"></a>
  <a href="https://zod.dev/"><img src="https://img.shields.io/badge/Zod-4-blue.svg" alt="Zod"></a>
  <img src="https://img.shields.io/badge/Tests-133%20passing-brightgreen.svg" alt="Tests">
</p>
<br/>

# Bloom - Core V2

Framework-agnostic authentication core for Bloom with native support for Next.js 15, Nuxt 4, SvelteKit 2, and more. Built with Zod v4 for runtime validation and type safety.

## Features

- Framework-agnostic headers abstraction
- Native support for Next.js, Express, Nuxt, SvelteKit, Elysia, Hono, Fastify, Astro
- Path-based hooks for before/after auth operations
- Zod v4 runtime validation
- Type-safe API with inferred types
- 133 tests across storage, adapters, and 8 frameworks

## Installation

```bash
pnpm add @bloom/core-v2
```

## Quick Start

```typescript
import { bloomAuth } from '@bloom/core-v2'
import { drizzleAdapter } from '@bloom/core-v2/adapters/drizzle'

const auth = bloomAuth({
  adapter: drizzleAdapter(db, { schema: { users, sessions } })
})
```

## Database Adapters

- [Drizzle](./src/adapters/drizzle/README.md) - Type-safe ORM for SQLite, PostgreSQL, MySQL
- [Kysely](./src/adapters/kysely/README.md) - SQL query builder with type safety
- [Prisma](./src/adapters/prisma/README.md) - Modern ORM with schema migrations
- [MongoDB](./src/adapters/mongodb/README.md) - NoSQL document database

```typescript
import { drizzleAdapter } from '@bloom/core-v2/adapters/drizzle'
import { drizzle } from 'drizzle-orm/better-sqlite3'

export const auth = bloomAuth({
  adapter: drizzleAdapter(db, { schema: { users, sessions } })
})
```

## Storage

Rate limiting and caching with [Redis or Memory](./src/storage/README.md).

```typescript
import { redisStorage, memoryStorage } from '@bloom/core-v2'

export const auth = bloomAuth({
  adapter: drizzleAdapter(db, { schema: { users, sessions } }),
  storage: redisStorage(redis, { keyPrefix: 'bloom:' })
})
```

## Hooks

Path-based hooks for before/after auth operations:

```typescript
const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  hooks: {
    '/register': {
      after: async (ctx) => {
        await sendWelcomeEmail(ctx.user.email)
      }
    },
    '/login': {
      before: async (ctx) => {
        await logLoginAttempt(ctx.body.email)
      }
    }
  }
})
```

## API

| Method | Description |
|--------|-------------|
| [`getSession`](./src/api/README.md#getsession) | Get current user session |
| [`register`](./src/api/README.md#register) | Register new user with email/password |
| [`login`](./src/api/README.md#login) | Login user with email/password |
| [`logout`](./src/api/README.md#logout) | Logout current session |
| [`getSessions`](./src/api/README.md#getsessions) | Get all user sessions |
| [`deleteSession`](./src/api/README.md#deletesession) | Delete specific session |
| [`deleteAllSessions`](./src/api/README.md#deleteallsessions) | Delete all sessions except current |
| [`sendVerificationEmail`](./src/api/README.md#sendverificationemail) | Send email verification token |
| [`verifyEmail`](./src/api/README.md#verifyemail) | Verify email with token |
| [`requestPasswordReset`](./src/api/README.md#requestpasswordreset) | Request password reset token |
| [`resetPassword`](./src/api/README.md#resetpassword) | Reset password with token |

## Headers

[Headers and cookies](./src/utils/headers/README.md) abstraction for 8 frameworks.

```typescript
import { getHeader, getCookie, getAllCookies, extractHeaders } from '@bloom/core-v2'

const userAgent = getHeader(await headers(), 'user-agent')
const sessionId = getCookie(await headers(), 'bloom.sid')
const cookies = getAllCookies(await headers())
const allHeaders = extractHeaders(await headers())
```

## License

This project is licensed under the GNU Affero General Public License v3.0.
