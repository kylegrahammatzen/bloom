# @bloom/core

<p align="center">
  <a href="https://bun.sh/"><img src="https://img.shields.io/badge/Bun-1.3+-black.svg" alt="Bun"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7+-blue.svg" alt="TypeScript"></a>
  <a href="https://zod.dev/"><img src="https://img.shields.io/badge/Zod-4-blue.svg" alt="Zod"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-blue.svg" alt="License"></a>
</p>

Framework-agnostic authentication core for Bloom with native support for Next.js 15, Nuxt 4, SvelteKit 2, Express, Fastify, Hono, Elysia, and Astro.

## Installation

```bash
bun add @bloom/core
```

## Quick Start

```typescript
import { bloomAuth } from '@bloom/core'
import { drizzleAdapter } from '@bloom/core/adapters/drizzle'

const auth = bloomAuth({
  adapter: drizzleAdapter(db, { schema: { users, sessions } })
})
```

## Database Adapters

- [Drizzle](./src/adapters/drizzle/README.md) - Type-safe ORM for SQLite, PostgreSQL, MySQL
- [Kysely](./src/adapters/kysely/README.md) - SQL query builder with type safety
- [Prisma](./src/adapters/prisma/README.md) - Modern ORM with schema migrations
- [MongoDB](./src/adapters/mongodb/README.md) - NoSQL document database

## Storage

Rate limiting and caching with Redis or Memory:

```typescript
import { redisStorage, memoryStorage } from '@bloom/core'

const auth = bloomAuth({
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
    }
  }
})
```

## API

| Method | Description |
|--------|-------------|
| `getSession` | Get current user session |
| `register` | Register new user with email/password |
| `login` | Login user with email/password |
| `logout` | Logout current session |
| `getSessions` | Get all user sessions |
| `deleteSession` | Delete specific session |
| `sendVerificationEmail` | Send email verification token |
| `verifyEmail` | Verify email with token |
| `requestPasswordReset` | Request password reset token |
| `resetPassword` | Reset password with token |

## Testing

```bash
bun test
```

## License

GNU Affero General Public License v3.0
