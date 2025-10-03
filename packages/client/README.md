# @bloom/client

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
import { BloomClient } from '@bloom/client';

const client = new BloomClient({
  baseURL: 'http://localhost:3000',
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
const client = new BloomClient({
  baseURL: 'https://api.example.com',
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

```typescript
import { BloomClient } from '@bloom/client';
import { useState } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const client = new BloomClient({ baseURL: '/api/auth' });

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
