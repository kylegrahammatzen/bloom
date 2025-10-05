<img src="../../../../../.github/banner.png" width="100%" alt="Bloom Banner" />

# Bloom - Sessions Plugin

Provides multi-session management, allowing users to view and revoke active sessions across devices.

## Features

- View all active sessions for a user
- Revoke specific sessions
- Device fingerprinting (browser, OS, device type)
- Current session detection

## Usage

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

## API Methods

### `auth.api.sessions.getAll(params)`

Get all sessions for the authenticated user.

- **Returns:** `Session[]` with device info and `isCurrent` flag
- **Throws:** `NOT_AUTHENTICATED` if not logged in

### `auth.api.sessions.revoke(params)`

Revoke a specific session.

- **Params:** `{ sessionId: string }`
- **Returns:** `{ message: string }`
- **Throws:** `NOT_AUTHENTICATED`, `SESSION_NOT_FOUND`, `UNAUTHORIZED`, `INVALID_INPUT`

**Note:** You cannot revoke your current session using this method. Use the logout endpoint instead.

## HTTP Routes

- `GET /api/auth/sessions` - Get all sessions
- `POST /api/auth/sessions/revoke` - Revoke session

## Session Data

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

## How It Works

1. **Device Fingerprinting:** On login, the plugin parses the `user-agent` header to extract browser, OS, and device type information
2. **Session Tracking:** Each session stores device metadata including IP address and last accessed timestamp
3. **Current Session Detection:** The `getAll` method marks the current session with `isCurrent: true`
4. **Last Active Updates:** The `last_accessed` field is updated every time the session is validated

## License

This project is licensed under the GNU Affero General Public License v3.0.
