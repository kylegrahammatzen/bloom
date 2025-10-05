# Bloom Next.js 15 Example

Next.js 15 App Router example with Bloom authentication, featuring server-side rendering and cookie-based sessions.

## Features

- Next.js 15 App Router with server components
- Server-side session validation with `getSession()`
- Multi-session management with device fingerprinting
- Redis secondary storage for session data
- Cookie-based authentication
- Middleware for quick cookie checks (doesn't validate sessions)
- Logger with custom prefix and colors
- Sessions plugin for managing active sessions
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
│   │   ├── auth.ts               # Auth configuration
│   │   └── db.ts                 # Database connection
│   └── middleware.ts             # Cookie check middleware
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

Start MongoDB and Redis (from root directory):

```bash
cd ../.. && pnpm docker:up
```

Run development server:

```bash
pnpm dev
```

Open http://localhost:3001

## How It Works

**Middleware (`middleware.ts`):**
- Only performs quick cookie existence checks
- Does NOT validate sessions or make database calls
- Redirects to login if no session cookie is found
- Keeps middleware fast and lightweight

**Page Validation (`getSession()`):**
- Server components use `getSession()` to fully validate sessions
- Checks session expiration and validity against the database
- Updates `last_accessed` timestamp on each validation
- This is where actual session validation happens

## License

This project is licensed under the GNU Affero General Public License v3.0.
