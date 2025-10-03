# Bloom

<div align="center">

[![License: AGPL](https://img.shields.io/badge/License-AGPL-red.svg)](LICENSE)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.7-green.svg)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-green.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

</div>

Bloom is an open-source framework-agnostic authentication SDK for TypeScript, with framework adapters for Express, Next.js, and more.

## Features

- Framework-agnostic core with adapters for Express and Next.js
- Type-safe authentication SDK
- Session management with Argon2id password hashing and Redis caching
- Email verification and password reset flows
- Server-side rendering support with Next.js adapter

## Package Structure

```
bloom/
├── packages/
│   ├── core/                # @bloom/core - Framework-agnostic authentication core
│   │   ├── server/express/  # Express server implementation
│   │   └── server/nextjs/   # Next.js server implementation
│   ├── client/              # @bloom/client - Browser HTTP client
│   ├── react/               # @bloom/react - React 19 hooks and provider
│   └── adapters/            # @bloom/adapters - Framework middleware
│       └── express/         # Express middleware adapters
├── apps/
│   ├── next15/              # Next.js 15 App Router example
│   ├── react-router-v7/     # React Router v7 example
│   └── express-server/      # Express server example
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

## Templates

Get started with Bloom using one of our example applications:

- [Next.js 15](apps/next15) - Full-stack Next.js App Router with SSR
- [React Router v7 + Express](apps/react-router-v7) - Client-side React with Express backend
- [Express Server](apps/express-server) - Standalone Express authentication server

## License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
