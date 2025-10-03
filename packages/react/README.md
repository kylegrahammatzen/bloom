# @bloom/react

React hooks and context provider for Bloom authentication, enabling seamless integration with React applications.

## Features

- React 19 support
- `useAuth` hook for authentication state
- `BloomProvider` context provider
- Automatic session management
- Type-safe API
- SSR compatible

## Installation

```bash
pnpm add @bloom/react @bloom/client
```

## Quick Start

```typescript
import { BloomProvider, useAuth } from '@bloom/react';

function App() {
  return (
    <BloomProvider baseURL="/api/auth">
      <Dashboard />
    </BloomProvider>
  );
}

function Dashboard() {
  const { user, session, isLoading, signIn, signOut } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div>
      <h1>Welcome {user.email}</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## BloomProvider

Wrap your app with `BloomProvider` to enable authentication:

```typescript
import { BloomProvider } from '@bloom/react';

<BloomProvider baseURL="http://localhost:3000/api/auth">
  <App />
</BloomProvider>
```

## useAuth Hook

```typescript
const {
  user,
  session,
  isLoading,
  signIn,
  signUp,
  signOut,
  deleteAccount,
  verifyEmail,
  requestEmailVerification,
  resetPassword,
  requestPasswordReset,
  refetch,
} = useAuth();
```

### Properties

- `user`: Current user object or null
- `session`: Current session object or null
- `isLoading`: Boolean indicating if auth state is loading

### Methods

All methods return a promise with `data` or `error`:

```typescript
const result = await signIn({ email, password });

if (result.error) {
  console.error(result.error.message);
}
```

## Sign In Form

```typescript
import { useAuth } from '@bloom/react';
import { useState } from 'react';

export function LoginForm() {
  const { signIn, refetch } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await signIn({ email, password });

    if (result.error) {
      setError(result.error.message);
    } else {
      await refetch();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div>{error}</div>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

## Sign Up Form

```typescript
export function SignUpForm() {
  const { signUp, refetch } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await signUp({ email, password });

    if (result.error) {
      setError(result.error.message);
    } else {
      await refetch();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div>{error}</div>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

## Delete Account

```typescript
export function DeleteAccountButton() {
  const { deleteAccount } = useAuth();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete your account?')) {
      const result = await deleteAccount();

      if (result.error) {
        alert(result.error.message);
      }
    }
  };

  return <button onClick={handleDelete}>Delete Account</button>;
}
```

## Password Reset

```typescript
export function RequestResetForm() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await requestPasswordReset({ email });

    if (result.data) {
      setSuccess(true);
    }
  };

  if (success) {
    return <div>Check your email for reset instructions</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit">Request Reset</button>
    </form>
  );
}
```

## Protected Routes

```typescript
import { useAuth } from '@bloom/react';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}
```

## Type Exports

```typescript
import type {
  User,
  Session,
  AuthContextValue,
} from '@bloom/react';
```

## License

This project is licensed under the GNU Affero General Public License v3.0.
