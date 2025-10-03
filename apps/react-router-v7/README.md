# Bloom React Router v7 Example

React Router v7 example with Bloom authentication, featuring client-side routing and session management.

## Features

- React Router v7 with React 19
- Client-side authentication with Bloom
- Type-safe authentication with TypeScript
- Tailwind CSS v4 styling
- shadcn/ui components

## Package Structure

```
apps/react-router-v7/
├── app/
│   ├── routes/               # Route components
│   │   ├── _index.tsx        # Home page
│   │   └── _layout.tsx       # Root layout
│   ├── components/           # React components
│   │   ├── auth/            # Auth components
│   │   └── ui/              # UI components
│   └── root.tsx             # App root
```

## Setup

Install dependencies:

```bash
pnpm install
```

Configure environment variables:

```bash
cp .env.example .env
```

Update `.env` with your values:

```env
VITE_API_URL=http://localhost:5000
```

Start the Express server (in a separate terminal):

```bash
cd ../express-server
pnpm dev
```

Run development server:

```bash
pnpm dev
```

Open http://localhost:3000

## Usage

App Setup:

```typescript
import { BloomProvider } from '@bloom/react';
import { Outlet } from 'react-router';

export default function App() {
  return (
    <BloomProvider baseURL={import.meta.env.VITE_API_URL}>
      <Outlet />
    </BloomProvider>
  );
}
```

Using Authentication Hook:

```typescript
import { useAuth } from '@bloom/react';

export const Profile = () => {
  const { user, isLoading, isSignedIn, signOut } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isSignedIn) return <div>Please sign in</div>;

  return (
    <div>
      <h1>Welcome {user?.email}</h1>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
};
```

Login Form:

```typescript
import { useAuth } from '@bloom/react';
import { useNavigate } from 'react-router';

export const LoginForm = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    const res = await signIn(data);
    if (!res.error) {
      navigate('/');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
};
```

Protected Routes:

```typescript
import { useAuth } from '@bloom/react';
import { Navigate } from 'react-router';

export const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isSignedIn) return <Navigate to="/login" />;

  return children;
};
```

## License

This project is licensed under the GNU Affero General Public License v3.0.
