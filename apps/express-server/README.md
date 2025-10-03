# Bloom Express Server Example

Express server example with Bloom authentication, featuring session-based authentication with Redis storage.

## Features

- Express server with Bloom authentication
- Session-based authentication with Redis storage
- Argon2id password hashing
- Email verification and password reset flows
- Type-safe authentication with TypeScript
- CORS and security middleware

## Package Structure

```
apps/express-server/
├── src/
│   └── index.ts              # Server entry point
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
PORT=5000
FRONTEND_URL=http://localhost:3000
```

Start MongoDB and Redis:

```bash
pnpm docker:up
```

Run development server:

```bash
pnpm dev
```

Server runs on http://localhost:5000

## Usage

Basic Server Setup:

```typescript
import 'dotenv/config';
import { bloomServer } from '@bloom/core/server/express';
import type { AuthEventContext } from '@bloom/core';

bloomServer({
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
}).start();
```

Adding Custom Routes:

```typescript
const server = bloomServer(config);

server.addRoute('/api/users', async (req, res) => {
  res.json({ message: 'Custom route' });
});

server.addRoute('/api/protected', async (req, res) => {
  res.json({ user: req.user });
}, { protected: true });

server.start();
```

Using Middleware Adapters:

```typescript
import express from 'express';
import { bloomAuth } from '@bloom/core';
import { toExpressHandler, requireAuth } from '@bloom/adapters/express';

const app = express();
const auth = bloomAuth(config);

app.all('/api/auth/*', toExpressHandler(auth));

app.get('/api/protected', requireAuth(), (req, res) => {
  res.json({ user: req.user });
});

app.listen(5000);
```

## API Endpoints

All endpoints are available under `/api/auth`:

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current session
- `POST /api/auth/email/verify` - Verify email
- `POST /api/auth/email/resend` - Resend verification email
- `POST /api/auth/password/reset` - Request password reset
- `POST /api/auth/password/update` - Update password
- `DELETE /api/auth/account` - Delete account

## License

This project is licensed under the GNU Affero General Public License v3.0.
