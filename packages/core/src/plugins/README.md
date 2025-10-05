# Bloom Plugins

Plugins extend Bloom's authentication system with additional features and API methods.

## Built-in Plugins

### Sessions Plugin

Provides multi-session management, allowing users to view and revoke active sessions across devices.

**Features:**
- View all active sessions for a user
- Revoke specific sessions
- Device fingerprinting (browser, OS, device type)
- Current session detection

**Usage:**

```typescript
import { bloomAuth, sessions } from '@bloom/core';

const auth = bloomAuth({
  database: mongoose,
  plugins: [
    sessions(),
  ],
});

// Server-side API usage
const allSessions = await auth.api.sessions.getAll({
  headers: { cookie: 'bloom.sid=...' }
});

await auth.api.sessions.revoke({
  headers: { cookie: 'bloom.sid=...' },
  body: { sessionId: 'session-to-revoke' }
});
```

**API Methods:**

- `auth.api.sessions.getAll(params)` - Get all sessions for authenticated user
  - Returns: `Session[]` with device info and `isCurrent` flag
  - Throws: `NOT_AUTHENTICATED` if not logged in

- `auth.api.sessions.revoke(params)` - Revoke a specific session
  - Params: `{ sessionId: string }`
  - Returns: `{ message: string }`
  - Throws: `NOT_AUTHENTICATED`, `SESSION_NOT_FOUND`, `UNAUTHORIZED`, `INVALID_INPUT`

**HTTP Routes:**

- `GET /api/auth/sessions` - Get all sessions
- `POST /api/auth/sessions/revoke` - Revoke session

**Session Data:**

```typescript
type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  lastAccessedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  isCurrent?: boolean;
  user?: User;
};
```

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

## Available Plugins

| Plugin | Description | Routes |
|--------|-------------|--------|
| `sessions()` | Multi-session management | `GET /sessions`, `POST /sessions/revoke` |

More plugins coming soon!

## License

This project is licensed under the GNU Affero General Public License v3.0.
