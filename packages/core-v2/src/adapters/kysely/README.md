<img src="../../../../.github/banner.png" width="100%" alt="Bloom Banner" />

# Bloom Core V2 - Kysely Adapter

Database adapter for Kysely query builder supporting SQLite, PostgreSQL, and MySQL.

## Installation

```bash
pnpm add kysely
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

### SQLite

```typescript
import { Kysely, SqliteDialect } from 'kysely'
import Database from 'better-sqlite3'
import { kyselyAdapter } from '@bloom/core-v2/adapters/kysely'
import { bloomAuth } from '@bloom/core-v2'

const db = new Kysely({
  dialect: new SqliteDialect({
    database: new Database('auth.db')
  })
})

export const auth = bloomAuth({
  adapter: kyselyAdapter(db),
})
```

### PostgreSQL

```typescript
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { kyselyAdapter } from '@bloom/core-v2/adapters/kysely'
import { bloomAuth } from '@bloom/core-v2'

const db = new Kysely({
  dialect: new PostgresDialect({
    pool: new Pool({
      host: 'localhost',
      database: 'auth',
    })
  })
})

export const auth = bloomAuth({
  adapter: kyselyAdapter(db),
})
```

### MySQL

```typescript
import { Kysely, MysqlDialect } from 'kysely'
import { createPool } from 'mysql2'
import { kyselyAdapter } from '@bloom/core-v2/adapters/kysely'
import { bloomAuth } from '@bloom/core-v2'

const db = new Kysely({
  dialect: new MysqlDialect({
    pool: createPool({
      host: 'localhost',
      database: 'auth',
    })
  })
})

export const auth = bloomAuth({
  adapter: kyselyAdapter(db),
})
```

## Schema

Define your database schema with the required columns:

### SQLite

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT 0,
  name TEXT,
  image TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_login INTEGER
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  last_accessed_at INTEGER NOT NULL
);
```

### PostgreSQL

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  name TEXT,
  image TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  last_login TIMESTAMP
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL,
  last_accessed_at TIMESTAMP NOT NULL
);
```

### MySQL

```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  name VARCHAR(255),
  image TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  last_login DATETIME
);

CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  last_accessed_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Configuration

### Custom Table Names

```typescript
export const auth = bloomAuth({
  adapter: kyselyAdapter(db, {
    tables: {
      users: 'auth_users',
      sessions: 'auth_sessions',
    },
  }),
})
```

## Migrations

Use Kysely Migrator for database migrations:

```typescript
import { Migrator, FileMigrationProvider } from 'kysely'
import { promises as fs } from 'fs'
import * as path from 'path'

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.join(__dirname, 'migrations'),
  }),
})

await migrator.migrateToLatest()
```

## Notes

Email addresses are automatically normalized to lowercase.

Expired sessions are filtered automatically in queries. Use `adapter.session.deleteExpired()` to clean up.

Sessions cascade delete when users are deleted.

## License

This project is licensed under the GNU Affero General Public License v3.0.
