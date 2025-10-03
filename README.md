# Bloom

<div align="center">

[![License: AGPL](https://img.shields.io/badge/License-AGPL-red.svg)](LICENSE)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.7-green.svg)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-green.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

</div>

Bloom is an open-source framework-agnostic authentication SDK for TypeScript, with framework adapters for Express, React, Next.js, and more.

## Features

- Framework-agnostic core with React and Express adapters
- Type-safe authentication SDK
- Session management with Argon2id password hashing and Redis caching
- Email verification and password reset flows

## Package Structure

```
bloom/
├── packages/
│   ├── core/               # @bloom/core - Authentication core
│   │   └── server/express  # Express server adapter
│   ├── client/             # @bloom/client - Browser HTTP client
│   ├── react/              # @bloom/react - React 19 hooks and provider
│   └── adapters/
│       └── express         # @bloom/adapters - Express middleware adapters
├── apps/
│   ├── react-router-v7/    # Example React Router v7 application
│   └── express-server/     # Example Express server implementation
```

## Getting Started

```bash
# Clone and install
git clone https://github.com/kylegrahammatzen/bloom.git
cd bloom
pnpm install

# Start MongoDB and Redis
pnpm docker:up

# Start dev servers
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Usage

**Server (Express):**

```typescript
import 'dotenv/config';
import { bloomServer } from '@bloom/core/server/express';
import type { AuthEventContext } from '@bloom/core';

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
  emailAndPassword: {
    requireEmailVerification: true,
  },
  callbacks: {
    onAuthEvent: (ctx: AuthEventContext) => {
      console.log(`[${ctx.action}] ${ctx.email || ctx.userId}`);
    },
  },
}).start();
```

**Client (React):**

```typescript
import { BloomProvider, useAuth } from '@bloom/react';

function App() {
  return (
    <BloomProvider baseURL="http://localhost:5000">
      <Dashboard />
    </BloomProvider>
  );
}

function Dashboard() {
  const { user, isLoading, signOut } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome {user?.email}</h1>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

## License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
