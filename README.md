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
- Cookie-based session management with Argon2id password hashing
- Email verification and password reset flows
- Server-side rendering support with Next.js adapter
- Dictionary attack protection with common password blacklist
- IP-based rate limiting for authentication endpoints
- Multi-session management with device tracking

## Security

Bloom implements modern security best practices:

- **Argon2id password hashing** - Memory-hard algorithm resistant to GPU/ASIC attacks
- **Unique salt per password** - 256-bit cryptographically secure salts prevent rainbow table attacks
- **Dictionary attack prevention** - Common password blacklist and entropy validation
- **Cookie-based sessions** - Server-side sessions with instant revocation capability
- **Rate limiting** - IP-based throttling with automatic account locking
- **Constant-time comparison** - Prevents timing attacks on password verification

See [SECURITY.md](SECURITY.md) for detailed security documentation.

## Example Apps

- [Next.js 15](apps/next15) - Next.js App Router with integrated Bloom auth server
- [React Router v7](apps/react-router-v7) - Client-side React application
- [Express Server](apps/express-server) - Standalone Express authentication server

## Packages

- [@bloom/core](packages/core) - Framework-agnostic authentication core
- [@bloom/adapters](packages/adapters) - Framework adapters for Express and Next.js
- [@bloom/client](packages/client) - Browser HTTP client for authentication
- [@bloom/react](packages/react) - React hooks and context provider

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

## License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
