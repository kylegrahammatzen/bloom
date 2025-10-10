<img src="../../../../.github/banner.png" width="100%" alt="Bloom Banner" />

# Bloom Core V2 - Handler

Universal HTTP handler using Web Standard Request/Response API. Framework-agnostic foundation for all auth requests.

## Overview

The handler system provides three core components working together:

| Component | Purpose |
|-----------|---------|
| Router | Route registration and matching with path parameters |
| Context | Request context with parsed data (method, path, query, headers, body) |
| Handler | Web Standard Request → Response processing pipeline |

All built on Web Standard APIs for maximum compatibility across frameworks and runtimes.

---

## Router

### Path Patterns

**Exact Match**
```typescript
router.register({
  path: '/session',
  method: 'GET',
  handler: async (ctx) => new Response('OK')
})
```

**Dynamic Parameters**
```typescript
router.register({
  path: '/sessions/:id',
  method: 'DELETE',
  handler: async (ctx) => {
    const { id } = ctx.params  // Extract from URL
    return new Response(JSON.stringify({ deleted: id }))
  }
})
```

**Wildcard**
```typescript
router.register({
  path: '/auth/*',
  method: 'GET',
  handler: async (ctx) => new Response('OK')
})
```

### Methods

**register(route)**
```typescript
router.register({
  path: '/login',
  method: 'POST',
  handler: async (ctx) => {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

**match(path, method)**
```typescript
const match = router.match('/sessions/abc123', 'DELETE')
// { handler: Function, params: { id: 'abc123' } }
```

**list()**
```typescript
const routes = router.list()
// All registered routes
```

---

## Context

Request context passed to all handlers:

```typescript
type Context = {
  request: Request              // Original Web Request
  method: string                // GET, POST, DELETE, etc.
  path: string                  // /auth/session
  query: Record<string, string> // URL query params
  headers: Headers              // Request headers
  body: any                     // Parsed JSON/form data
  params: Record<string, string> // URL path params (:id)
  user: User | null             // Current user
  session: Session | null       // Current session
}
```

Body parsing is automatic based on Content-Type:
- `application/json` → Parsed JSON object
- `application/x-www-form-urlencoded` → Parsed form data

---

## Handler

Universal HTTP handler processes Web Standard Requests.

### Request Flow

```
Request → Parse → match → emit events → execute → Response
```

### Configuration

```typescript
const handler = createHandler({
  router,           // Router instance
  emitter,          // EventEmitter instance
  basePath: '/auth' // Strip this prefix from paths
})
```

### Usage

```typescript
const request = new Request('http://localhost:3000/auth/session', {
  method: 'GET',
  headers: { 'Cookie': 'bloom.sid=xyz123' }
})

const response = await handler(request)
// Web Standard Response
```

### Error Handling

Errors are caught and return 500 responses:

```typescript
router.register({
  path: '/error',
  method: 'GET',
  handler: async () => {
    throw new Error('Something went wrong')
  }
})

// Returns: { status: 500, body: { error: 'Internal Server Error' } }
```

---

## Events

Handler emits events at each stage:

**request:start** - Request received
**endpoint:before** - Before handler execution
**endpoint:after** - After handler execution
**request:end** - Request completed
**request:error** - Handler threw error
**request:notfound** - No matching route

```typescript
auth.on('request:start', (data) => {
  console.log(`${data.method} ${data.path}`)
})

auth.on('request:end', (data) => {
  console.log(`${data.method} ${data.path} - ${data.status}`)
})
```

---

## Integration

Handler is built into BloomAuth:

```typescript
const auth = bloomAuth({ adapter: drizzleAdapter(db) })

// Register custom routes
auth.router.register({
  path: '/custom',
  method: 'POST',
  handler: async (ctx) => new Response('OK')
})

// Process requests
const response = await auth.handler(request)
```

---

## Framework Adapters

Framework adapters convert to Web Standard Request:

**Next.js**
```typescript
import { toNextJsHandler } from '@bloom/adapters/nextjs'
export const { GET, POST, DELETE } = toNextJsHandler({ auth })
```

**Express**
```typescript
import { toExpressHandler } from '@bloom/adapters/express'
app.all('/api/auth/*', toExpressHandler(auth))
```

---

## Why Web Standard?

- Framework agnostic - one handler everywhere
- Easy testing - create Request objects directly
- Future proof - built on web standards
- Edge compatible - works in all runtimes

---

## License

This project is licensed under the GNU Affero General Public License v3.0.
