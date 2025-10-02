# Bloom

<div align="center">

[![License: AGPL](https://img.shields.io/badge/License-AGPL-red.svg)](LICENSE)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.7-green.svg)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-green.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

</div>

Bloom is an open-source framework-agnostic authentication SDK for TypeScript, with framework adapters for Express, React, Next.js, and more.

## Features

- Framework-agnostic core SDK
- React hooks and components
- Express middleware and handlers
- Type-safe throughout
- Argon2id password hashing
- Session management
- Rate limiting
- Email verification
- Password reset
- Account deletion
- Plugin system (future)

## Package Structure

```
bloom/
├── packages/
│   ├── core/       # @bloom/core - Server authentication
│   ├── client/     # @bloom/client - Browser client
│   ├── react/      # @bloom/react - React bindings
│   └── node/       # @bloom/node - Node.js adapters
├── apps/
│   ├── frontend/   # Demo React application
│   └── server/     # Demo Express server
```

## Getting Started

1. Clone and install dependencies:

   ```bash
   git clone https://github.com/kylegrahammatzen/bloom.git
   cd bloom
   npm install
   ```

2. Start MongoDB with Docker:

   ```bash
   npm run docker:up
   ```

3. Start development servers:

   ```bash
   npm run dev
   ```

## Usage

### Server-Side Configuration

Create an auth.ts file in your server:

```typescript
import { bloomAuth } from "@bloom/core";

export const auth = bloomAuth({
  database: {
    provider: "mongodb",
    uri: process.env.MONGODB_URI,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    cookieName: "bloom.sid",
  },
  emailAndPassword: {
    enabled: true,
  },
});
```

Mount the auth handler in Express:

```typescript
import { toExpressHandler } from "@bloom/node/express";
import { auth } from "./lib/auth";

app.all("/api/auth/*", toExpressHandler(auth.handler));
```

Protect routes with middleware:

```typescript
import { requireAuth } from "@bloom/node/express";

app.get("/api/protected", requireAuth(), (req, res) => {
  res.json({ user: req.user });
});
```

### Client-Side Usage

Wrap your app with BloomProvider:

```typescript
import { BloomProvider } from '@bloom/react'

<BloomProvider baseURL="http://localhost:5000">
  <App />
</BloomProvider>
```

Use the useAuth hook in components:

```typescript
import { useAuth } from '@bloom/react'

function Dashboard() {
  const { user, signOut } = useAuth()
  return <div>Welcome {user?.email}</div>
}
```

## Development

```bash
# Start development servers
npm run dev

# Build all packages
npm run build

# Run tests
npm run test

# Run linting
npm run lint
```

## Tech Stack

- React with TypeScript and Tailwind CSS
- Express.js with TypeScript backend
- MongoDB with Mongoose ODM
- Argon2id for password hashing
- Session management with rate limiting
- Docker for MongoDB development

## License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
