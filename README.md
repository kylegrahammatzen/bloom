# Bloom

<p align="center">
  <a href="https://bun.sh/"><img src="https://img.shields.io/badge/Bun-1.3+-black.svg" alt="Bun"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9+-blue.svg" alt="TypeScript"></a>
  <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-6+-green.svg" alt="MongoDB"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-blue.svg" alt="License: AGPL-3.0"></a>
</p>

Bloom is an open-source framework-agnostic authentication SDK for TypeScript with native support for Express, Next.js, and 6 other frameworks.

## Packages

- [`@bloom/core`](packages/core) - Framework-agnostic authentication core
- [`@bloom/adapters`](packages/adapters) - Framework adapters for Express and Next.js
- [`@bloom/client`](packages/client) - Browser HTTP client for authentication
- [`@bloom/react`](packages/react) - React 19 hooks and context provider

## Features

- Framework-agnostic core with adapters for Express and Next.js
- Cookie-based session management with Argon2id password hashing
- Email verification and password reset flows
- IP-based rate limiting for authentication endpoints
- Multi-session management with device tracking

## Getting Started

```bash
git clone https://github.com/kylegrahammatzen/bloom.git
cd bloom
bun install

# Start MongoDB
bun docker:up

# Start dev server
bun dev

# Run tests
bun test
```

## Testing

```bash
# Run all tests
bun test

# Run tests for a specific package
bun test --cwd packages/core
```

## License

GNU Affero General Public License v3.0 - see [LICENSE](LICENSE)
