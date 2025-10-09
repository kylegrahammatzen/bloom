<img src="../../../../.github/banner.png" width="100%" alt="Bloom Banner" />

# Bloom Core V2 - Drizzle Adapter

Database adapter for Drizzle ORM supporting SQLite, PostgreSQL, and MySQL.

## Installation

```bash
pnpm add drizzle-orm
```

Install your database driver:

```bash
# SQLite
pnpm add better-sqlite3

# PostgreSQL
pnpm add pg

# MySQL
pnpm add mysql2
```

## Usage

```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { drizzleAdapter } from '@bloom/core-v2/adapters/drizzle'
import { bloomAuth } from '@bloom/core-v2'
import { users, sessions } from './schema'

const sqlite = new Database('auth.db')
const db = drizzle(sqlite)

export const auth = bloomAuth({
  adapter: drizzleAdapter(db, {
    schema: { users, sessions }
  }),
})
```

## Schema

Define your schema with the required columns:

```typescript
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  password_salt: text('password_salt').notNull(),
  email_verified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  name: text('name'),
  image: text('image'),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
  last_login: integer('last_login', { mode: 'timestamp' }),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  user_id: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires_at: integer('expires_at', { mode: 'timestamp' }).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  last_accessed_at: integer('last_accessed_at', { mode: 'timestamp' }).notNull(),
})
```

For PostgreSQL and MySQL, use the appropriate column types from `drizzle-orm/pg-core` or `drizzle-orm/mysql-core`.

## Migrations

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## Notes

Email addresses are automatically normalized to lowercase.

Expired sessions are filtered automatically in queries. Use `adapter.session.deleteExpired()` to clean up.

Sessions cascade delete when users are deleted.

## License

This project is licensed under the GNU Affero General Public License v3.0.
