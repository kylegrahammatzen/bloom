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

- Framework-agnostic core with React and Express adapters
- Type-safe authentication SDK
- Session management with Argon2id password hashing
- Email verification and password reset flows

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

```bash
# Clone and install
git clone https://github.com/kylegrahammatzen/bloom.git
cd bloom
npm install

# Start MongoDB
npm run docker:up

# Start dev servers
npm run dev

# Build all packages
npm run build

# Run tests
npm run test
```

## Usage

**Server:**

```typescript
import { bloomAuth } from "@bloom/core";
import { toExpressHandler } from "@bloom/node/express";

const auth = bloomAuth({
  database: { provider: "mongodb", uri: process.env.MONGODB_URI },
  emailAndPassword: { enabled: true },
});

app.all("/api/auth/*", toExpressHandler(auth.handler));
```

**Client:**

```typescript
import { BloomProvider, useAuth } from '@bloom/react'

<BloomProvider baseURL="http://localhost:5000">
  <App />
</BloomProvider>

// In components:
const { user, signOut } = useAuth()
```

## License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
