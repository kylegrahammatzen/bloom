# Bloom Core V2 - Plugins

Extend Bloom with custom routes, hooks, and API methods.

## Plugin Architecture

Plugins are the recommended way to add custom functionality to Bloom. Each plugin can provide:

- **Routes**: Custom HTTP endpoints
- **Hooks**: Before/after middleware for existing routes
- **API Methods**: Server-side methods on `auth.api`

## Available Plugins

- [Autumn](./autumn/README.md) - Pricing & billing with Stripe integration

## Creating a Plugin

```typescript
import type { BloomPlugin } from '@bloom/core-v2'

export const myPlugin = (config: MyConfig): BloomPlugin => {
  return {
    id: 'my-plugin',

    // Custom HTTP routes
    routes: [
      {
        path: '/custom-endpoint',
        method: 'POST',
        handler: async (ctx) => {
          return Response.json({ data: 'custom response' })
        },
      },
    ],

    // Path-based hooks
    hooks: {
      '/register': {
        after: async (ctx) => {
          await sendWelcomeEmail(ctx.user.email)
        },
      },
    },

    // API methods (automatically assigned to auth.api[id])
    // Receives auth instance and optional storage
    api: (auth, storage) => ({
      doSomething: async (params) => {
        // Custom API method with optional caching
        if (storage) {
          const cached = await storage.get('key')
          if (cached) return JSON.parse(cached)
        }

        const data = await fetchData()

        if (storage) {
          await storage.set('key', JSON.stringify(data), 300)
        }

        return data
      },
    }),
  }
}
```

## Using Plugins

Add plugins to your auth configuration:

```typescript
import { bloomAuth } from '@bloom/core-v2'
import { autumn } from '@bloom/core-v2/plugins/autumn'
import { myPlugin } from './my-plugin'

const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  plugins: [
    autumn({ apiKey: 'am_sk_...' }),
    myPlugin({ /* config */ }),
  ],
})
```

### With Storage (Optional)

Plugins can leverage storage for caching and temporary data:

```typescript
import { redisStorage } from '@bloom/core-v2/storage/redis'

const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  storage: redisStorage(redis), // Passed to plugins for caching
  plugins: [
    autumn({ apiKey: 'am_sk_...' }),
    myPlugin({ /* config */ }),
  ],
})
```

**Without storage:** Plugins work normally but cannot cache data
**With storage:** Plugins can cache data using `storage.get()` and `storage.set()`

## Plugin Context

Plugin route handlers receive a `Context` object with:

```typescript
type Context = {
  body: any                    // Parsed JSON body
  params: Record<string, string>  // URL params (/users/:id)
  headers: Headers             // Request headers
  user?: User                  // Current user (if authenticated)
  session?: Session            // Current session (if authenticated)
}
```

## Plugin API Methods

Plugin API methods are automatically assigned to `auth.api[plugin.id]`. The `api` function receives the auth instance and optional storage:

```typescript
api: (auth, storage) => {
  // Private helper (not exposed to users)
  const getUser = async (params: ApiMethodParams) => {
    const session = await auth.api.getSession(params)
    if (!session) throw new Error('Not authenticated')
    return session.user
  }

  // Public methods (exposed via auth.api.myPlugin)
  return {
    myMethod: async (params: ApiMethodParams) => {
      const user = await getUser(params)

      // Use storage if available
      if (storage) {
        const cacheKey = `user:${user.id}:data`
        const cached = await storage.get(cacheKey)
        if (cached) return JSON.parse(cached)

        const data = await fetchData(user.id)
        await storage.set(cacheKey, JSON.stringify(data), 300)
        return data
      }

      // Without storage, fetch every time
      return await fetchData(user.id)
    },
  }
}
```

## TypeScript Types

Extend the `BloomAuthApi` type for TypeScript support:

```typescript
declare module '@bloom/core-v2' {
  interface BloomAuthApi {
    myPlugin: {
      myMethod(params: ApiMethodParams): Promise<MyResponse>
    }
  }
}
```

## Examples

### Custom Route with Authentication

```typescript
routes: [
  {
    path: '/admin/stats',
    method: 'GET',
    handler: async (ctx) => {
      if (!ctx.user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const stats = await getAdminStats()
      return Response.json(stats)
    },
  },
]
```

### Hook with Error Handling

```typescript
hooks: {
  '/login': {
    after: async (ctx) => {
      try {
        await trackLogin(ctx.user.id)
      } catch (error) {
        console.error('Failed to track login:', error)
        // Don't throw - hooks should not block the request
      }
    },
  },
}
```

## License

This project is licensed under the GNU Affero General Public License v3.0.
