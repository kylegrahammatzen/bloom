<img src="../../.github/banner.png" width="100%" alt="Bloom Banner" />

# Bloom - Core V2

Framework-agnostic authentication core for Bloom with native support for Next.js 15, Nuxt 4, SvelteKit 2, and more. Built with Zod v4 for runtime validation and type safety.

## Features

- Framework-agnostic headers abstraction
- Native support for Next.js, Express, Nuxt, SvelteKit, Elysia, Hono, Fastify, Astro
- Event-driven architecture with wildcard pattern support
- Zod v4 runtime validation with metadata
- Type-safe API with inferred types
- Zero manual cookie extraction required
- 94+ tests across event system, storage, and 8 frameworks

## Installation

```bash
pnpm add @bloom/core-v2
```

## Quick Start

```typescript
import { bloomAuth } from '@bloom/core-v2';

const auth = bloomAuth();
```

## Database Adapters

Connect to any database with framework-agnostic adapters:

- [Drizzle](./src/adapters/drizzle/README.md) - Type-safe ORM for SQLite, PostgreSQL, MySQL
- [Kysely](./src/adapters/kysely/README.md) - SQL query builder with type safety
- [Prisma](./src/adapters/prisma/README.md) - Modern ORM with schema migrations
- [MongoDB](./src/adapters/mongodb/README.md) - NoSQL document database

```typescript
import { drizzleAdapter } from '@bloom/core-v2/adapters/drizzle';
import { drizzle } from 'drizzle-orm/better-sqlite3';

export const auth = bloomAuth({
  adapter: drizzleAdapter(db, { schema: { users, sessions } }),
});
```

## Storage

High-speed storage for rate limiting and caching with [Redis or Memory](./src/storage/README.md).

```typescript
import { redisStorage, memoryStorage } from '@bloom/core-v2';

export const auth = bloomAuth({
  adapter: drizzleAdapter(db, { schema: { users, sessions } }),
  storage: redisStorage(redis, { keyPrefix: 'bloom:' }),
});
```

## Events

Dynamic [event system](./src/events/README.md) for lifecycle hooks and plugin communication.

```typescript
export const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  events: {
    'user:created': async (user) => {
      await sendWelcomeEmail(user.email);
    },
    'session:found': async ({ user, session }) => {
      console.log('User logged in:', user.email);
    },
    'user:*': async (data) => {
      // Listen to all user events
      await logUserActivity(data);
    },
  },
});

// Runtime registration
auth.on('payment:completed', async (data) => {
  await sendReceipt(data.email);
});

await auth.emit('payment:completed', { email: 'user@example.com' });
```

## Headers

Work with [headers and cookies](./src/utils/headers/README.md) across frameworks without manual parsing.

```typescript
import { getHeader, getCookie, getAllCookies, extractHeaders } from '@bloom/core-v2';

const userAgent = getHeader(await headers(), 'user-agent');
const sessionId = getCookie(await headers(), 'bloom.sid');
const cookies = getAllCookies(await headers());
const allHeaders = extractHeaders(await headers());
```

## API

### `getSession`

Get the current user session from framework headers:

```typescript
const session = await auth.api.getSession({
  headers: await headers()
});

if (session) {
  console.log(session.user.email);
  console.log(session.session.id);
}
```

Returns `{ user: User; session: Session } | null`

## License

This project is licensed under the GNU Affero General Public License v3.0.
