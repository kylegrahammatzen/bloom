# Bloom Plugins

Plugins extend Bloom's authentication system with additional features and API methods.

## Available Plugins

| Plugin | Description | Documentation |
|--------|-------------|---------------|
| [sessions](./sessions) | Multi-session management with device fingerprinting | [README](./sessions/README.md) |

## Creating Custom Plugins

Plugins use the `init` hook to extend the `auth.api` object with new methods.

### Plugin Interface

```typescript
type BloomPlugin = {
  name: string;
  init?: (auth: BloomAuth) => void | Promise<void>;
};
```

### Example: Custom Plugin

```typescript
import type { BloomPlugin, BloomAuth, ApiMethodParams } from '@bloom/core';

export const myPlugin = (): BloomPlugin => {
  return {
    name: 'my-plugin',
    init: (auth: BloomAuth) => {
      // Access auth config
      const cookieName = auth.config.session?.cookieName || 'bloom.sid';

      // Add custom API methods
      auth.api.myFeature = {
        doSomething: async (params: ApiMethodParams) => {
          // Access headers, body, query from params
          const { headers, body, query } = params;

          // Use auth.config for configuration
          // Use auth.getSession() or auth.verifySession() for auth

          return { success: true };
        },
      };
    },
  };
};
```

### Plugin Best Practices

1. **Use the init hook with closure** to access `auth.config`:
   ```typescript
   init: (auth: BloomAuth) => {
     const config = auth.config.session;
     // Use config in your methods
   }
   ```

2. **Validate authentication** in your methods:
   ```typescript
   const sessionData = parseSessionCookie(cookies[cookieName]);
   if (!sessionData) {
     throw new APIError(APIErrorCode.NOT_AUTHENTICATED);
   }
   ```

3. **Use structured errors** from `@/schemas/errors`:
   ```typescript
   import { APIError, APIErrorCode } from '@/schemas/errors';
   throw new APIError(APIErrorCode.UNAUTHORIZED);
   ```

4. **Add TypeScript types** for type safety:
   ```typescript
   declare module '@bloom/core' {
     interface BloomAuthApi {
       myFeature?: {
         doSomething: (params: ApiMethodParams) => Promise<{ success: boolean }>;
       };
     }
   }
   ```

5. **Register HTTP routes** in the handler by adding to `packages/core/src/handler.ts`:
   ```typescript
   const routes: Record<string, Record<string, RouteHandler>> = {
     POST: {
       '/my-feature/action': handleMyFeatureAction,
     },
   };
   ```

### Plugin Architecture

```
┌─────────────────┐
│   bloomAuth()   │
└────────┬────────┘
         │
         ├─ Register plugins
         │
         v
┌─────────────────┐
│  plugin.init()  │
└────────┬────────┘
         │
         ├─ Extend auth.api
         │
         v
┌─────────────────┐
│   auth.api.X    │  ← New API methods
└─────────────────┘
```

## License

This project is licensed under the GNU Affero General Public License v3.0.
