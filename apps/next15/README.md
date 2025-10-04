# Bloom Next.js 15 Example

Next.js 15 App Router example with Bloom authentication, featuring server-side rendering and cookie-based sessions.

## Features

- Next.js 15 App Router with server components
- Server-side session validation with `getSession()`
- Cookie-based authentication
- Middleware-based route protection
- Type-safe authentication with TypeScript
- Tailwind CSS v4 styling

## Package Structure

```
apps/next15/
├── src/
│   ├── app/
│   │   ├── api/auth/[...bloom]/  # Bloom API routes
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Home page with auth
│   ├── components/
│   │   ├── auth/                 # Auth components
│   │   └── ui/                   # UI components
│   ├── lib/
│   │   └── db.ts                 # Database connection
│   └── middleware.ts             # Route protection
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
DATABASE_URL=mongodb://bloom:bloom-dev-password@localhost:27017/bloom-auth?authSource=admin
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your-super-secret-session-key
```

Start MongoDB and Redis:

```bash
pnpm docker:up
```

Run development server:

```bash
pnpm dev
```

Open http://localhost:3001

## Usage

Server Component:

```typescript
import { getSession } from '@bloom/adapters/nextjs';

export default async function Page() {
  const session = await getSession();

  if (!session) {
    return <div>Please sign in</div>;
  }

  return <div>Welcome (userId: {session.userId})</div>;
}
```

Middleware:

```typescript
import { bloomMiddleware } from '@bloom/adapters/nextjs';

export default bloomMiddleware({
  protectedRoutes: ['/dashboard'],
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

API Route Handler:

```typescript
import { createAuthHandler } from '@bloom/adapters/nextjs';
import { bloomAuth } from '@bloom/core';
import type { AuthEventContext } from '@bloom/core';
import { connectDB } from '@/lib/db';

const auth = bloomAuth({
  database: {
    uri: process.env.DATABASE_URL,
  },
  session: {
    secret: process.env.SESSION_SECRET,
    expiresIn: 7 * 24 * 60 * 60 * 1000,
  },
  sessionStore: {
    type: 'redis',
    uri: process.env.REDIS_URL,
  },
  emailAndPassword: {
    requireEmailVerification: false,
  },
  callbacks: {
    onAuthEvent: (ctx: AuthEventContext) => {
      console.log(`[${ctx.action}] ${ctx.email || ctx.userId}`);
    },
  },
});

const handler = createAuthHandler({ auth, connectDB });

export const GET = handler.GET;
export const POST = handler.POST;
export const DELETE = handler.DELETE;
```

Client Components:

```typescript
'use client';

import { useAuth } from '@bloom/react';
import { useRouter } from 'next/navigation';

export const LoginForm = () => {
  const router = useRouter();
  const { signIn, refetch } = useAuth();

  const handleSubmit = async (data) => {
    const res = await signIn(data);
    await refetch();
    router.refresh();
  };

  return <form onSubmit={handleSubmit}>...</form>;
};
```

## License

This project is licensed under the GNU Affero General Public License v3.0.
