<img src="../../../../.github/banner.png" width="100%" alt="Bloom Banner" />

# Bloom Core V2 - Prisma Adapter

Database adapter for Prisma ORM supporting SQLite, PostgreSQL, MySQL, and more.

## Installation

```bash
pnpm add @prisma/client
pnpm add -D prisma
```

## Setup

Initialize Prisma:

```bash
pnpm prisma init
```

## Usage

```typescript
import { PrismaClient } from '@prisma/client'
import { prismaAdapter } from '@bloom/core-v2/adapters/prisma'
import { bloomAuth } from '@bloom/core-v2'

const prisma = new PrismaClient()

export const auth = bloomAuth({
  adapter: prismaAdapter(prisma),
})
```

## Schema

Define your Prisma schema with the required models:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // or "sqlite", "mysql", etc.
  url      = env("DATABASE_URL")
}

model User {
  id             String    @id
  email          String    @unique
  password_hash  String
  password_salt  String
  email_verified Boolean   @default(false)
  name           String?
  image          String?
  created_at     DateTime
  updated_at     DateTime
  last_login     DateTime?
  sessions       Session[]
}

model Session {
  id               String   @id
  user_id          String
  expires_at       DateTime
  created_at       DateTime
  last_accessed_at DateTime
  user             User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
}
```

## Migrations

Generate and run migrations:

```bash
pnpm prisma migrate dev --name init
```

For production:

```bash
pnpm prisma migrate deploy
```

## Database Examples

### SQLite

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./auth.db"
}
```

### PostgreSQL

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Example `DATABASE_URL`:
```
postgresql://user:password@localhost:5432/auth
```

### MySQL

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

Example `DATABASE_URL`:
```
mysql://user:password@localhost:3306/auth
```

## Prisma Studio

View and edit your data:

```bash
pnpm prisma studio
```

## Generate Client

After schema changes:

```bash
pnpm prisma generate
```

## Notes

Email addresses are automatically normalized to lowercase.

Expired sessions are filtered automatically in queries. Use `adapter.session.deleteExpired()` to clean up.

Sessions cascade delete when users are deleted through Prisma relations.

## License

This project is licensed under the GNU Affero General Public License v3.0.
