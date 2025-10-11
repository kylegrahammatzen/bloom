<img src="../../../../.github/banner.png" width="100%" alt="Bloom Banner" />

# Bloom Core V2 - Handler

Universal HTTP handler using Web Standard Request/Response. Framework-agnostic foundation for all auth requests.

## Components

| Component | Purpose |
|-----------|---------|
| **Router** | Route registration and matching (exact, params, wildcard) |
| **Context** | Request data (method, path, query, headers, body, params, user, session, hooks) |
| **Handler** | Request to Response pipeline with error handling |

---

## Router

**Path Patterns:**
```typescript
// Exact match
router.register({ path: '/session', method: 'GET', handler })

// Dynamic params
router.register({ path: '/sessions/:id', method: 'DELETE', handler })
// ctx.params = { id: 'abc123' }

// Wildcard
router.register({ path: '/auth/*', method: 'GET', handler })
```

**Methods:**
- `register(route)` - Add route
- `match(path, method)` - Find matching route with params
- `list()` - Get all routes

---

## Context

Request context passed to all handlers:

```typescript
type Context = {
  request: Request
  method: string
  path: string
  query: Record<string, string>
  headers: Headers
  body: unknown
  params: Record<string, string>
  user: User | null
  session: Session | null
  hooks: {
    before?: () => Promise<void>
    after?: () => Promise<void>
  }
}
```

**Body Parsing** (automatic based on Content-Type):
- `application/json` - JSON value
- `application/x-www-form-urlencoded` - `Record<string, string>`
- `multipart/form-data` - `MultipartBody` (with optional `_files` metadata)

**Helper Types:**
```typescript
import type { FileInfo, MultipartBody } from '@/handler/context'

// FileInfo = { fieldname, filename, encoding, mimetype }
// MultipartBody = Record<string, string> & { _files?: FileInfo[] }
```

---

## Handler

**Request Flow:**
```
Request > Parse Body > Route Match > Execute Handler > Response
```

**Usage:**
```typescript
const handler = createHandler({
  router,
  emitter,
  hookedPaths,
  basePath: '/auth'
})

const response = await handler(request)
```

**Error Handling:**
- Catches all errors and returns 500 responses
- Returns 404 for non-matching routes
- Returns 429 for rate limit exceeded
