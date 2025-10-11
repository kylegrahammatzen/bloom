<img src="../../../../.github/banner.png" width="100%" alt="Bloom Banner" />

# Bloom Core V2 - Hooks & Events

Path-based hooks for auth operations and dynamic event system for custom events and plugin communication.

## Overview

Bloom provides two ways to extend functionality:

1. **Hooks** - Path-based before/after hooks for auth operations
2. **Events** - Dynamic event system with wildcard support for custom events and plugins

Hooks are the recommended way to extend auth operations. Events are for custom functionality and plugin communication.

## Hooks

### Quick Start

```typescript
import { bloomAuth } from '@bloom/core-v2'
import { drizzleAdapter } from '@bloom/adapters/drizzle'

const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  hooks: {
    '/register': {
      after: async (ctx) => {
        await sendWelcomeEmail(ctx.body.email)
      }
    },
    '/send-verification-email': {
      after: async (ctx) => {
        await sendEmail({
          to: ctx.body.email,
          subject: 'Verify your email',
          html: `Click here to verify: ${verificationLink}`
        })
      }
    }
  }
})
```

### Available Paths

- `/register` - User registration
- `/login` - User login
- `/logout` - User logout
- `/sessions` - Get all sessions (GET) or delete all except current (DELETE)
- `/sessions/:id` - Delete specific session
- `/send-verification-email` - Request email verification
- `/verify-email` - Verify email with token
- `/request-password-reset` - Request password reset
- `/reset-password` - Reset password with token

### Execution Order

1. Request received
2. Validation checks pass
3. `before` hook runs
4. Database operations
5. `after` hook runs
6. Response sent

### Context Type

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

### Examples

**Send welcome email:**
```typescript
hooks: {
  '/register': {
    after: async (ctx) => {
      await sendEmail({
        to: ctx.body.email,
        subject: 'Welcome!',
        html: `<h1>Welcome ${ctx.body.name}!</h1>`
      })
    }
  }
}
```

**Log auth events:**
```typescript
hooks: {
  '/login': {
    after: async (ctx) => {
      await db.insert(auditLog).values({
        userId: ctx.user!.id,
        action: 'login'
      })
    }
  }
}
```

**Rate limit resets:**
```typescript
hooks: {
  '/request-password-reset': {
    before: async (ctx) => {
      const recent = await checkRecentPasswordResets(ctx.body.email)
      if (recent > 3) {
        throw new Error('Too many password reset attempts')
      }
    }
  }
}
```

### Performance

O(1) Set lookups for registered hooks. No runtime overhead for paths without hooks.

## Events

### `auth.on()`

Register an event listener with wildcard support.

```typescript
auth.on(event: string, handler: EventHandler): void
```

**Examples:**
```typescript
auth.on('user:created', async (user) => {
  await sendWelcomeEmail(user.email)
})

// Wildcard patterns
auth.on('user:*', async (data) => {
  await logUserActivity(data)
})

auth.on('*:created', async (data) => {
  await notifyAdmins(data)
})

auth.on('*', async (data) => {
  console.log('Any event:', data)
})
```

### `auth.emit()`

Emit an event to all matching listeners.

```typescript
auth.emit(event: string, data?: any): Promise<void>
```

**Example:**
```typescript
await auth.emit('user:created', {
  id: '123',
  email: 'user@example.com'
})
```

**Behavior:**
- Matches exact event names and wildcard patterns
- Handlers run in parallel via `Promise.all`
- Errors are caught and logged without crashing

### `auth.off()`

Remove an event listener.

```typescript
auth.off(event: string, handler: EventHandler): void
```

### `auth.events.list()`

List all registered event names.

```typescript
auth.events.list(): string[]
```

### `auth.events.listeners()`

Get all listeners for a specific event.

```typescript
auth.events.listeners(event: string): EventHandler[]
```

## Plugin Events

Plugins can emit custom events that the core or other plugins can listen to:

```typescript
// Plugin emits event
await ctx.emit('oauth:connected', {
  user: ctx.user,
  provider: 'github'
})

// Core listens to plugin event
auth.on('oauth:connected', async ({ user, provider }) => {
  await sendEmail(user.email, `${provider} connected!`)
})
```
