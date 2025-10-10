<img src="../../../../.github/banner.png" width="100%" alt="Bloom Banner" />

# Bloom Core V2 - Rate Limiting

Protect your auth endpoints from abuse with configurable rate limits.

## Overview

Built-in rate limiter with auto-detection (Storage > Database > Memory). No external dependencies required. Works in serverless, traditional servers, and edge environments.

## Configuration

| Option | Type | Description |
|--------|------|-------------|
| `enabled` | `boolean` | Enable rate limiting (auto in production) |
| `window` | `number` | Time window in seconds |
| `max` | `number` | Maximum requests in window |
| `ipHeaders` | `string[]` | Headers to check for IP (in order) |
| `rules` | `Record<string, Rule>` | Custom rules per path |

---

## Basic Example

```typescript
import { bloomAuth } from '@bloom/core-v2'
import { drizzleAdapter } from '@bloom/core-v2/adapters/drizzle'

export const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  rateLimit: {
    enabled: true,
    window: 60,  // 60 seconds
    max: 100,    // 100 requests
  },
})
```

---

## Auto-Detection

Rate limiting automatically chooses the best strategy:

**1. With Storage (Recommended for Production):**
```typescript
import { redisStorage } from '@bloom/core-v2'

export const auth = bloomAuth({
  adapter: drizzleAdapter(db, {
    schema: { users, sessions }
  }),
  storage: redisStorage(redis),  // Uses Redis for rate limiting
  rateLimit: {
    window: 60,
    max: 100,
  },
})
```

**2. With Database (No External Dependencies):**
```typescript
export const auth = bloomAuth({
  adapter: drizzleAdapter(db, {
    schema: { users, sessions, rateLimits }  // Uses database for rate limiting
  }),
  rateLimit: {
    window: 60,
    max: 100,
  },
})
```

**3. Memory Fallback (Dev Only - Warns in Production):**
```typescript
export const auth = bloomAuth({
  adapter: drizzleAdapter(db, {
    schema: { users, sessions }  // No rateLimits table, no storage
  }),
  rateLimit: {
    window: 60,
    max: 100,
  },
})
// Warns: "Rate limiting using in-memory storage in production..."
```

---

## Custom Rules

### Per-Path Limits

Protect sensitive endpoints with stricter limits:

```typescript
rateLimit: {
  window: 60,
  max: 100,
  rules: {
    '/sign-in/email': { window: 10, max: 3 },
    '/two-factor/verify': { window: 10, max: 3 },
  },
}
```

### Wildcard Patterns

```typescript
rateLimit: {
  window: 60,
  max: 100,
  rules: {
    '/two-factor/*': { window: 10, max: 3 },
    '/admin/*': { window: 60, max: 50 },
  },
}
```

### Function Rules

Dynamic limits based on context:

```typescript
rateLimit: {
  window: 60,
  max: 100,
  rules: {
    '/api/create': async (ctx) => {
      // Check if user is authenticated
      if (ctx.user) {
        return { window: 60, max: 100 }
      }
      // Stricter for anonymous
      return { window: 10, max: 5 }
    },
  },
}
```

### Disable for Specific Paths

```typescript
rateLimit: {
  window: 60,
  max: 100,
  rules: {
    '/get-session': false,  // No limit
  },
}
```

---

## IP Headers

Customize which headers to check for client IP (in order):

```typescript
rateLimit: {
  window: 60,
  max: 100,
  ipHeaders: ['cf-connecting-ip', 'x-forwarded-for', 'x-real-ip'],
}
```

**Default order:**
1. `x-forwarded-for`
2. `cf-connecting-ip`
3. `x-real-ip`

**Cloudflare Example:**
```typescript
rateLimit: {
  window: 60,
  max: 100,
  ipHeaders: ['cf-connecting-ip'],  // Cloudflare only
}
```

---

## Response Headers

When rate limit is exceeded, response includes:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-Retry-After: 45

{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Retry after 45 seconds."
}
```

---

## Events

Listen to rate limit events:

```typescript
export const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  rateLimit: {
    window: 60,
    max: 100,
  },
  events: {
    'ratelimit:exceeded': async (data) => {
      console.log(`Rate limit exceeded for ${data.path}`)
      console.log(`Retry after: ${data.retryAfter}s`)

      // Send alert, log to monitoring, etc.
    },
  },
})
```

---

## Storage Strategies

### Redis Storage (Recommended for Production)

```typescript
import { createClient } from 'redis'
import { redisStorage } from '@bloom/core-v2'

const redis = createClient({ url: process.env.REDIS_URL })
await redis.connect()

export const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  storage: redisStorage(redis, {
    keyPrefix: 'bloom:',
    defaultTTL: 3600,
  }),
  rateLimit: {
    window: 60,
    max: 100,
  },
})
```

**Benefits:**
- Fastest performance
- Works in serverless
- Shared across instances
- Automatic expiration

### Database Fallback

Add `rateLimits` table to your schema:

```typescript
export const rateLimits = pgTable('rate_limits', {
  id: text('id').primaryKey(),
  key: text('key').notNull(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'bigint' }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
})

export const auth = bloomAuth({
  adapter: drizzleAdapter(db, {
    schema: { users, sessions, rateLimits }
  }),
  rateLimit: {
    window: 60,
    max: 100,
  },
})
```

**Benefits:**
- No external dependencies
- Always works
- Good for traditional servers

### Memory Storage (Dev Only)

```typescript
export const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  rateLimit: {
    window: 60,
    max: 100,
  },
})
// Uses in-memory Map (warns in production)
```

**Benefits:**
- Zero setup
- Fast for development
- No external dependencies

**Limitations:**
- Data lost on restart
- Not shared across instances
- Not suitable for serverless

---

## Enable/Disable

**Auto-enable in production:**
```typescript
rateLimit: {
  // enabled: true in production, false in development
  window: 60,
  max: 100,
}
```

**Explicit control:**
```typescript
rateLimit: {
  enabled: process.env.NODE_ENV === 'production',
  window: 60,
  max: 100,
}
```

**Always enable (even in dev):**
```typescript
rateLimit: {
  enabled: true,
  window: 60,
  max: 100,
}
```

---

## Testing

Disable rate limiting in tests:

```typescript
export const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  rateLimit: {
    enabled: false,
    window: 60,
    max: 100,
  },
})
```

Or test rate limiting behavior:

```typescript
const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  storage: memoryStorage(),
  rateLimit: {
    enabled: true,
    window: 1,
    max: 2,
  },
})

// First 2 requests should pass
await auth.handler(request1)
await auth.handler(request2)

// 3rd request should return 429 Too Many Requests
await auth.handler(request3)

// Wait for window to expire
await new Promise(resolve => setTimeout(resolve, 1100))

// Should work again
await auth.handler(request4)
```

---

## Notes

### Server-Side API Calls

Rate limits only apply to HTTP requests via `auth.handler`. Direct API calls are not rate limited:

```typescript
// Not rate limited
const session = await auth.api.getSession({ headers })

// Rate limited
const response = await auth.handler(request)
```

### Multiple Rules

When multiple rules match, the first match wins:

```typescript
rateLimit: {
  rules: {
    '/api/users/create': { window: 10, max: 1 },  // Exact match (used)
    '/api/users/*': { window: 60, max: 10 },      // Wildcard (ignored)
  },
}
```

### Cleanup

Database records automatically expire via `expiresAt` field. Run cleanup periodically:

```typescript
// Manual cleanup (optional)
if (adapter.rateLimit) {
  const cleaned = await adapter.rateLimit.cleanup()
  console.log(`Cleaned ${cleaned} expired records`)
}
```

## License

This project is licensed under the GNU Affero General Public License v3.0.
