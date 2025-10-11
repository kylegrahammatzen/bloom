<p align="center">
  <a href="https://kylegm.com/" target="_blank" rel="noopener noreferrer">
    <img width="600" src=".github/banner.png" alt="Bloom Banner">
  </a>
</p>
<br/>
<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL-red.svg" alt="License: AGPL"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-20-green.svg" alt="Node.js"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-blue.svg" alt="TypeScript"></a>
  <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-8.7-green.svg" alt="MongoDB"></a>
  <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-19-blue.svg" alt="React"></a>
  <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express.js-4.21-green.svg" alt="Express.js"></a>
</p>
<br/>

# Bloom

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
