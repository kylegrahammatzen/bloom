<img src="../../../../.github/banner.png" width="100%" alt="Bloom Banner" />

# Bloom Core V2 - Storage

High-speed storage for rate limiting, session caching, and temporary data.

## Overview

Simple key-value interface for caching and temporary data. When storage is not provided, features fall back to database tables or signed cookies. All implementations support TTL for automatic expiration.

## Available Storage

| Storage | Use Case |
|---------|----------|
| [Memory](#memory-storage) | Development and traditional servers |
| [Redis](#redis-storage) | Production and distributed systems |

---

## API Reference

### `Storage` Type

The base storage interface that all implementations follow.

**Signature:**
```typescript
type Storage = {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string, ttl?: number) => Promise<void>
  delete: (key: string) => Promise<void>
}
```

**Methods:**
- `get(key)` - Retrieve value by key, returns `null` if not found or expired
- `set(key, value, ttl?)` - Store value with optional TTL in seconds
- `delete(key)` - Remove value by key

---

### `memoryStorage()`

In-memory storage for development and traditional servers.

**Signature:**
```typescript
function memoryStorage(): Storage
```

**Returns:** Storage instance with in-memory Map

**Warning:** Does NOT work in serverless environments (Vercel, Netlify, etc.) where each request gets a new instance. Use Redis for production.

**Performance:** Fastest option for traditional servers. Automatic cleanup on expiration check.

---

### `redisStorage()`

Redis storage for production and distributed systems.

**Signature:**
```typescript
function redisStorage(client: RedisClient, options?: RedisStorageOptions): Storage
```

**Parameters:**
- `client` - Connected Redis client (node-redis)
- `options` - Optional configuration:
  - `keyPrefix` - Prefix for all keys (default: `''`)
  - `defaultTTL` - Default TTL in seconds for all keys (default: `undefined`)

**Returns:** Storage instance backed by Redis

**Performance:** Production-ready with persistence and distribution support.

---

## Storage Examples

### Memory Storage

```typescript
import { memoryStorage } from '@bloom/core-v2'
import { drizzleAdapter } from '@bloom/core-v2/adapters/drizzle'

export const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  storage: memoryStorage(),
})
```

**Use Cases:**
- Local development
- Traditional servers (not serverless)
- Testing

**Limitations:**
- Data lost on restart
- Not shared across instances
- Not suitable for serverless

---

### Redis Storage

```typescript
import { createClient } from 'redis'
import { redisStorage } from '@bloom/core-v2'
import { drizzleAdapter } from '@bloom/core-v2/adapters/drizzle'

const redis = createClient({
  url: process.env.REDIS_URL,
})
await redis.connect()

export const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  storage: redisStorage(redis, {
    keyPrefix: 'bloom:',
    defaultTTL: 3600,
  }),
})
```

**Use Cases:**
- Production environments
- Serverless deployments
- Distributed systems
- High-performance rate limiting

**Options:**

`keyPrefix` - Namespace keys to avoid conflicts:
```typescript
storage: redisStorage(redis, {
  keyPrefix: 'bloom:auth:',
})
```

`defaultTTL` - Set default expiration for all keys:
```typescript
storage: redisStorage(redis, {
  defaultTTL: 7200, // 2 hours in seconds
})
```

Override TTL per key:
```typescript
await storage.set('temp-token', 'abc123', 300) // 5 minutes
```

---

## Auto-Detection

When storage is provided, features automatically use it for better performance:

```typescript
export const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  storage: redisStorage(redis),
  rateLimit: {
    // Automatically uses Redis storage
    window: 60,
    max: 100,
  },
  session: {
    cookieCache: {
      // Automatically uses Redis for caching
      maxAge: 300,
    },
  },
})
```

When storage is NOT provided, fallback strategies are used:
- Rate limiting uses database table
- Session cache uses signed cookies
- All features work without storage (just slower)

---

## Custom Storage

Implement your own storage by following the `Storage` interface:

```typescript
import type { Storage } from '@bloom/core-v2'

function customStorage(): Storage {
  return {
    async get(key: string): Promise<string | null> {
      // Your implementation
      return null
    },
    async set(key: string, value: string, ttl?: number): Promise<void> {
      // Your implementation
    },
    async delete(key: string): Promise<void> {
      // Your implementation
    },
  }
}

export const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  storage: customStorage(),
})
```

---

## Notes

### TTL Behavior

TTL is always in seconds:
```typescript
await storage.set('key', 'value', 60)    // Expires in 1 minute
await storage.set('key', 'value', 3600)  // Expires in 1 hour
await storage.set('key', 'value')        // Never expires (unless defaultTTL set)
```

Memory storage checks expiration on `get()` and automatically deletes expired entries.

Redis storage uses native TTL support with `SETEX` for efficient expiration.

### Key Prefixes

Use key prefixes to avoid conflicts when sharing Redis with other applications:

```typescript
storage: redisStorage(redis, {
  keyPrefix: 'bloom:',
})

// Keys stored as: bloom:session:abc123
// Keys stored as: bloom:ratelimit:user:123
```

### Error Handling

- `get()` returns `null` on errors (fails gracefully)
- `set()` and `delete()` throw errors on failure
- Redis connection errors propagate to caller

### Testing

Use memory storage for tests to avoid external dependencies:

```typescript
import { memoryStorage } from '@bloom/core-v2'

const storage = memoryStorage()

// Tests run fast without Redis
await storage.set('test-key', 'test-value', 10)
expect(await storage.get('test-key')).toBe('test-value')
```

For integration tests, use Docker to run Redis locally:

```bash
docker run -p 6379:6379 redis
```

Set `REDIS_URL` in `.env`:
```bash
REDIS_URL=redis://localhost:6379
```

## License

This project is licensed under the GNU Affero General Public License v3.0.
