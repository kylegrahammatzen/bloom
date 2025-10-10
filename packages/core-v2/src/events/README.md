<img src="../../../../.github/banner.png" width="100%" alt="Bloom Banner" />

# Bloom Core V2 - Events

Dynamic event system for lifecycle hooks, custom events, and plugin communication.

## Overview

Event-driven architecture that uses string-based event names with wildcard support. No predefined events - just emit and listen to any event name. Built for flexibility and plugin extensibility.

Events use colon notation (e.g., `user:created`, `session:found`) and support wildcard patterns like `user:*`, `*:created`, or `*`.

## API Reference

### `EventHandler` Type

Handler function for event listeners.

```typescript
type EventHandler<T = any> = (data: T) => void | Promise<void>
```

---

### `auth.on()`

Register an event listener.

```typescript
auth.on(event: string, handler: EventHandler): void
```

**Parameters:**
- `event` - Event name or wildcard pattern
- `handler` - Function to call when event is emitted

**Examples:**
```typescript
// Exact match
auth.on('user:created', async (user) => {
  console.log('New user:', user.email)
})

// Wildcard patterns
auth.on('user:*', async (data) => {
  console.log('User event:', data)
})

auth.on('*:created', async (data) => {
  console.log('Something was created:', data)
})

auth.on('*', async (data) => {
  console.log('Any event:', data)
})
```

---

### `auth.emit()`

Emit an event to all matching listeners.

```typescript
auth.emit(event: string, data?: any): Promise<void>
```

**Parameters:**
- `event` - Event name to emit
- `data` - Payload to pass to listeners

**Example:**
```typescript
await auth.emit('user:created', {
  id: '123',
  email: 'user@example.com'
})
```

**Behavior:**
- Executes all exact matches
- Executes all matching wildcard patterns
- Handlers run in parallel (via `Promise.all`)
- Errors are caught and logged (don't crash app)

---

### `auth.off()`

Remove an event listener.

```typescript
auth.off(event: string, handler: EventHandler): void
```

**Example:**
```typescript
const handler = async (user) => {
  console.log('User created:', user.email)
}

auth.on('user:created', handler)
auth.off('user:created', handler)
```

---

### `auth.events.list()`

List all registered event names.

```typescript
auth.events.list(): string[]
```

**Example:**
```typescript
const events = auth.events.list()
// ['user:created', 'user:*', 'session:found']
```

---

### `auth.events.listeners()`

Get all listeners for a specific event.

```typescript
auth.events.listeners(event: string): EventHandler[]
```

**Example:**
```typescript
const handlers = auth.events.listeners('user:created')
console.log(`${handlers.length} listeners registered`)
```

---

## Usage Examples

### Basic Events

```typescript
import { bloomAuth } from '@bloom/core-v2'
import { drizzleAdapter } from '@bloom/core-v2/adapters/drizzle'

export const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  events: {
    'user:created': async (user) => {
      await sendWelcomeEmail(user.email)
    },
    'session:found': async ({ user }) => {
      console.log('Session loaded for:', user.email)
    }
  }
})
```

### Wildcard Patterns

```typescript
// Listen to all user events
auth.on('user:*', async (data) => {
  await logUserActivity(data)
})

// Listen to all created events
auth.on('*:created', async (data) => {
  await notifyAdmins('New resource created', data)
})

// Catch-all for debugging
auth.on('*', async (data) => {
  console.log('Event fired:', data)
})
```

### Runtime Registration

```typescript
// Register events after auth initialization
auth.on('user:login', async (user) => {
  await trackLogin(user.id)
})

// Emit custom events
await auth.emit('payment:completed', {
  userId: '123',
  amount: 99.99
})
```

### Plugin Events

```typescript
// Plugin emits custom events
const oauthPlugin = {
  id: 'oauth',
  endpoints: [{
    path: '/oauth/callback',
    handler: async (req, ctx) => {
      const account = await linkOAuthAccount(ctx.user)

      // Emit plugin event
      await ctx.emit('oauth:connected', {
        user: ctx.user,
        provider: 'github'
      })
    }
  }]
}

// Core auth listens to plugin events
auth.on('oauth:connected', async ({ user, provider }) => {
  await sendEmail(user.email, `${provider} connected!`)
})
```

---

## Error Handling

Event handlers that throw errors are caught and logged but don't crash the app:

```typescript
auth.on('user:created', async (user) => {
  throw new Error('Handler failed!')
  // Error is logged, other handlers still run
})

auth.on('user:created', async (user) => {
  // This still executes
  await sendEmail(user.email)
})
```

Console output:
```
Error in event handler for "user:created": Error: Handler failed!
```

---

## Async Handlers

All handlers run in parallel via `Promise.all`:

```typescript
auth.on('user:created', async (user) => {
  await sendWelcomeEmail(user.email)  // Runs in parallel
})

auth.on('user:created', async (user) => {
  await createStripeCustomer(user)    // Runs in parallel
})

await auth.emit('user:created', user)
// Both handlers complete before emit() resolves
```

If you need sequential execution, chain them:

```typescript
auth.on('user:created', async (user) => {
  await sendWelcomeEmail(user.email)
  await waitForEmailConfirmation(user.email)
  await activateAccount(user.id)
})
```

---

## Testing Events

### Verify Events Fire

```typescript
import { vi } from 'vitest'

const handler = vi.fn()
auth.on('user:created', handler)

await createUser({ email: 'test@example.com' })

expect(handler).toHaveBeenCalledWith(
  expect.objectContaining({ email: 'test@example.com' })
)
```

### Test Event Data

```typescript
const data = []
auth.on('user:created', (user) => {
  data.push(user)
})

await createUser({ email: 'test@example.com' })

expect(data[0].email).toBe('test@example.com')
```

### Mock Event Emitter

```typescript
const mockEmit = vi.spyOn(auth, 'emit')

await auth.api.getSession({ headers })

expect(mockEmit).toHaveBeenCalledWith('session:found', expect.any(Object))
```

---

## License

This project is licensed under the GNU Affero General Public License v3.0.
