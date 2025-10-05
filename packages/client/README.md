<img src="../../.github/banner.png" width="100%" alt="Bloom Banner" />

# Bloom - Client

Browser HTTP client for Bloom authentication, providing a simple API for interacting with Bloom auth endpoints.

## Features

- Type-safe authentication API
- Automatic error handling
- Promise-based interface
- Framework-agnostic
- TypeScript support
- Cookie-based session management

## Installation

```bash
pnpm add @bloom/client
```

## Quick Start

```typescript
import { createBloomClient } from '@bloom/client';

const client = createBloomClient({
  baseUrl: 'http://localhost:3000',
});

const result = await client.signIn({
  email: 'user@example.com',
  password: 'password123',
});

if (result.data) {
  console.log('Logged in:', result.data.user);
}

if (result.error) {
  console.error('Login failed:', result.error);
}
```

## Configuration

```typescript
const client = createBloomClient({
  baseUrl: 'https://api.example.com',
});
```

## API Methods

### Sign Up

```typescript
const result = await client.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
});
```

Response:

```typescript
{
  data?: {
    message: string;
    user: User;
    session: Session;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### Sign In

```typescript
const result = await client.signIn({
  email: 'user@example.com',
  password: 'securePassword123',
});
```

### Sign Out

```typescript
const result = await client.signOut();
```

### Get Session

```typescript
const result = await client.getSession();

if (result.data) {
  console.log('Current user:', result.data.user);
  console.log('Session:', result.data.session);
}
```

### Delete Account

```typescript
const result = await client.deleteAccount();
```

### Get All Sessions

Get all active sessions for the authenticated user (requires `sessions` plugin):

```typescript
const result = await client.getSessions();

if (result.data) {
  console.log('Active sessions:', result.data.sessions);

  result.data.sessions.forEach(session => {
    console.log(`${session.browser} on ${session.os}`);
    console.log(`Last active: ${session.lastAccessedAt}`);
    if (session.isCurrent) {
      console.log('This is your current session');
    }
  });
}
```

Response:

```typescript
{
  data?: {
    sessions: Session[];
  };
  error?: BloomError;
}
```

### Revoke Session

Revoke a specific session (requires `sessions` plugin):

```typescript
const result = await client.revokeSession('session-id-to-revoke');

if (result.data) {
  console.log('Session revoked successfully');
}
```

**Note:** You cannot revoke your current session using this method. Use `signOut()` instead.

### Verify Email

```typescript
const result = await client.verifyEmail({
  token: 'verification-token-from-email',
});
```

### Request Email Verification

```typescript
const result = await client.requestEmailVerification();
```

### Reset Password

```typescript
const result = await client.resetPassword({
  token: 'reset-token-from-email',
  newPassword: 'newSecurePassword123',
});
```

### Request Password Reset

```typescript
const result = await client.requestPasswordReset({
  email: 'user@example.com',
});
```

## Error Handling

All methods return a result object with `data` or `error`:

```typescript
const result = await client.signIn({ email, password });

if (result.error) {
  switch (result.error.code) {
    case 'INVALID_CREDENTIALS':
      console.error('Wrong email or password');
      break;
    case 'ACCOUNT_LOCKED':
      console.error('Account is locked');
      break;
    case 'RATE_LIMITED':
      console.error('Too many attempts');
      break;
    default:
      console.error('Login failed:', result.error.message);
  }
}
```

## Type Exports

```typescript
import type {
  User,
  Session,
  SignInCredentials,
  SignUpCredentials,
} from '@bloom/client';
```

## Usage with React

For React applications, use the [@bloom/react](../react) package which provides hooks and context:

```typescript
import { useAuth } from '@bloom/react';

function LoginForm() {
  const { signIn, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signIn({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div>{error}</div>}
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit" disabled={isLoading}>Sign In</button>
    </form>
  );
}
```

Or use the client directly:

```typescript
import { createBloomClient } from '@bloom/client';
import { useState } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const client = createBloomClient({ baseUrl: '/api/auth' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await client.signIn({ email, password });

    if (result.error) {
      setError(result.error.message);
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div>{error}</div>}
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

## License

This project is licensed under the GNU Affero General Public License v3.0.
