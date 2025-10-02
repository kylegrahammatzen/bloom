# Bloom SDK Documentation

## Overview

Bloom is a framework-agnostic authentication SDK for TypeScript following the better-auth pattern. It provides a unified authentication system with framework adapters for Express, React, Next.js, and more.

## Architecture

### Core Principles

1. Single Source of Truth: One auth.ts file defines all authentication configuration
2. Framework-Agnostic Core: The core SDK works anywhere JavaScript runs
3. Adapter Pattern: Framework-specific handlers wrap the core functionality
4. Clean Separation: SDK = logic, Adapter = framework integration, Server = app setup

### Package Structure

```
bloom/
├── packages/
│   ├── core/       # @bloom/core - Server authentication logic
│   ├── client/     # @bloom/client - Browser client
│   ├── react/      # @bloom/react - React bindings
│   └── node/       # @bloom/node - Node.js adapters
├── apps/
│   ├── frontend/   # Demo React application
│   └── server/     # Demo Express server
```

## Separation of Concerns

### @bloom/core (Framework-Agnostic)

What it handles:
- All authentication logic (register, login, logout, verify, reset)
- Password hashing/verification (Argon2)
- Token generation/validation
- Session data creation/storage in database
- Rate limiting logic (IP-based, user-based)
- Email/password validation
- Database operations (User, Session, Token, UserCredentials models)

What it does NOT handle:
- HTTP cookies (framework-specific)
- HTTP headers (framework-specific)
- Express sessions (framework-specific)
- CORS, Helmet, body parsing (framework-specific)

Dependencies:
- argon2 (password hashing)
- mongoose (database ODM)
- crypto (Node.js built-in)

### @bloom/node/express (Express Adapter)

What it handles:
- Convert Express Request → SDK Context
- Convert SDK Response → Express Response
- Set/clear session cookies based on SDK session data
- Extract IP address, user agent from Express request
- Handle Express-specific middleware integration
- Ensure request body is parsed (use express.json() internally or require it)

What it does NOT handle:
- Authentication logic (that's in core)
- Database operations (that's in core)
- Password hashing (that's in core)

Body Parsing Strategy:
- Option 1: Adapter includes express.json() internally, applied only to auth routes
- Option 2: Adapter requires body parsing middleware before it (documented requirement)
- Recommended: Option 1 - adapter handles its own body parsing for self-contained operation

### Server (Application-Specific)

What it handles:
- Express app setup (helmet, cors)
- Express session middleware configuration
- Database connection
- Environment variables
- Mounting auth handler via SDK
- Application routes (like /api/lab)
- Body parsing for non-auth routes (if needed)

What it does NOT handle:
- Authentication logic (SDK handles this)
- Rate limiting (SDK handles this based on auth config)
- Password validation (SDK handles this)
- Body parsing for auth routes (adapter handles this)

## Usage Examples

### Server-Side Configuration

Create an auth.ts file in your server:

```typescript
// apps/server/src/lib/auth.ts
import { bloomAuth } from '@bloom/core'

export const auth = bloomAuth({
  database: {
    provider: 'mongodb',
    uri: process.env.MONGODB_URI
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    cookieName: 'bloom.sid',
    secret: process.env.SESSION_SECRET
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true
  },
  rateLimit: {
    enabled: true,
    login: {
      max: 5,
      window: 15 * 60 * 1000 // 15 minutes
    },
    registration: {
      max: 3,
      window: 60 * 60 * 1000 // 1 hour
    }
  },
  callbacks: {
    onSignIn: async ({ user, session }) => {
      console.log('User signed in:', user.email)
    },
    onSignOut: async ({ userId }) => {
      console.log('User signed out:', userId)
    }
  }
})
```

### Express Server Setup

```typescript
// apps/server/src/index.ts
import express from 'express'
import session from 'express-session'
import { auth } from './lib/auth'
import { toExpressHandler, requireAuth } from '@bloom/node/express'

const app = express()

// Express middleware (helmet, cors, session)
// Note: Body parsing for auth routes handled by toExpressHandler internally
app.use(helmet({ ... }))
app.use(cors({ ... }))
app.use(session({ ... }))

// Mount auth handler - includes body parsing for auth routes
app.all('/api/auth/*', toExpressHandler(auth))

// Body parsing for other routes (if needed)
app.use(express.json())

// Protected routes
app.use('/api/lab', requireAuth(), labRoutes)
```

### Client-Side Usage (React)

```typescript
// apps/frontend/src/main.tsx
import { BloomProvider } from '@bloom/react'

<BloomProvider baseURL="http://localhost:5000">
  <App />
</BloomProvider>

// In components
import { useAuth } from '@bloom/react'

function Dashboard() {
  const { user, signOut } = useAuth()
  return <div>Welcome {user?.email}</div>
}
```

### Client-Side Usage (Vanilla JS)

```typescript
import { createBloomClient } from '@bloom/client'

const client = createBloomClient({ baseURL: 'http://localhost:5000' })
await client.signIn.email({ email, password })
const session = await client.getSession()
```

## Configuration Options

### bloomAuth()

```typescript
bloomAuth({
  database?: {
    provider?: 'mongodb'
    uri?: string
  }
  session?: {
    expiresIn?: number        // Session duration in ms
    cookieName?: string       // Cookie name
    secret?: string           // Session secret
  }
  emailAndPassword?: {
    enabled?: boolean
    requireEmailVerification?: boolean
  }
  rateLimit?: {
    enabled?: boolean
    login?: { max: number, window: number }
    registration?: { max: number, window: number }
    passwordReset?: { max: number, window: number }
  }
  callbacks?: {
    onSignIn?: (ctx: { user, session }) => void
    onSignOut?: (ctx: { userId }) => void
    onRegister?: (ctx: { user, session }) => void
  }
  plugins?: BloomPlugin[]
})
```

### createBloomClient()

```typescript
createBloomClient({
  baseURL: string              // Auth server URL
  fetchOptions?: {
    onError?: (ctx) => void   // Global error handler
    onSuccess?: (ctx) => void // Global success handler
  }
})
```

## Implementation Status

### Completed

1. Monorepo Structure
   - packages/core, client, react, node
   - apps/frontend, server

2. @bloom/core Package ✅
   - bloomAuth() factory function
   - Framework-agnostic types (no Express dependencies)
   - rou3-based routing for clean route handling
   - Full authentication handler with all endpoints
   - Rate limiting system (in-memory, configurable)
   - Uses all crypto utilities (hashPassword, verifyPassword, etc.)
   - Uses all models (User, Session, Token, UserCredentials)
   - Callback system (onSignIn, onSignOut, onRegister)

3. @bloom/client Package
   - createBloomClient() factory
   - Framework-agnostic HTTP client
   - Type-safe API methods

4. @bloom/react Package
   - BloomProvider component
   - useAuth() hook
   - Automatic session management

5. @bloom/node Package ✅
   - toExpressHandler() adapter (fully implemented)
   - Converts Express Request → Generic Context
   - Handles session management (set/clear cookies)
   - Extracts IP, user agent from requests
   - Includes body parsing middleware
   - requireAuth() middleware
   - attachUser() middleware

6. Frontend Application
   - Clean React + Vite + TypeScript setup
   - Using @bloom/react
   - Login, SignUp, Dashboard pages
   - Protected routes

7. Server Application ✅
   - Simplified Express server (~90 lines)
   - Using @bloom/core and @bloom/node
   - Single auth.ts config file
   - Clean separation of concerns

### Pending Implementation

1. Database-backed Rate Limiting (Optional)
   - Currently using in-memory storage
   - Could add MongoDB/Redis backend for distributed systems

2. Additional Framework Adapters
   - Elysia adapter
   - Fastify adapter
   - Next.js adapter
   - Hono adapter

## Architecture Implementation ✅

### Changes Completed

#### 1. Updated @bloom/core/src/auth.ts ✅
- ✅ Removed Express dependencies - fully framework-agnostic
- ✅ Implemented rou3-based routing for clean route handling
- ✅ Implemented in-memory rate limiting based on config
- ✅ Rate limits enforced for register, login, and password reset
- ✅ Returns 429 error when limits exceeded
- ✅ All handlers use `BloomHandlerContext` with generic request/response types

#### 2. Updated @bloom/node/express/handler.ts ✅
Fully implemented adapter with proper separation:

```typescript
export function toExpressHandler(auth: BloomAuth): Router {
  const router = express.Router()

  // Body parsing middleware for auth routes only
  router.use(express.json({ limit: '10mb' }))
  router.use(express.urlencoded({ extended: true, limit: '10mb' }))

  router.use(async (req: Request, res: Response, next: NextFunction) => {
    // Extract IP (handle proxies)
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.socket.remoteAddress || req.ip

    // Build framework-agnostic context
    const context: BloomHandlerContext = {
      request: {
        method: req.method,
        path: req.path,
        body: req.body,
        headers: req.headers,
        ip,
        userAgent: req.headers['user-agent'],
      },
      session: req.session && {
        userId: req.session.userId,
        sessionId: req.session.sessionId,
      },
    }

    const result = await auth.handler(context)

    // Set session cookie if SDK returned session data
    if (result.sessionData && req.session) {
      req.session.userId = result.sessionData.userId
      req.session.sessionId = result.sessionData.sessionId
    }

    // Clear session if SDK requested
    if (result.clearSession && req.session) {
      req.session.destroy()
      res.clearCookie(auth.config.session?.cookieName || 'bloom.sid')
    }

    res.status(result.status).json(result.body)
  })

  return router
}
```

#### 3. Simplified apps/server/src/index.ts ✅
- ✅ Removed duplicate body parsing before auth handler
- ✅ Adapter handles body parsing for auth routes
- ✅ Body parsing moved after auth handler for other routes
- ✅ Clean separation: server setup → mount adapter → done

## Benefits

1. Clean Separation
   - SDK = authentication logic
   - Adapter = framework integration
   - Server = application setup

2. Framework Agnostic
   - Core SDK has no Express dependencies
   - Can add Next.js, Fastify, Hono adapters easily
   - Rate limiting in SDK based on config

3. Simplified Server
   - Server code reduced from ~95 to ~60 lines
   - No duplicate logic between SDK and server
   - Single source of truth (auth.ts config)

4. Type Safety
   - Full TypeScript support throughout
   - Shared types across packages
   - Better developer experience

5. Extensibility
   - Plugin system ready
   - Custom callbacks
   - Middleware composition
   - Framework adapters

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Start development servers
npm run dev

# Run tests
npm run test
```

## Tech Stack

- React with TypeScript and Tailwind CSS
- Express.js with TypeScript backend
- MongoDB with Mongoose ODM
- Argon2id for password hashing
- Session management with rate limiting
- Docker for MongoDB development

## Future Enhancements

- OAuth providers (GitHub, Google, Twitter)
- Two-factor authentication
- Magic links
- Organizations and multi-tenant support
- Permissions and RBAC system
- Audit logs
- Plugin system for community extensions
- Next.js adapter
- React Router adapter
- Vue adapter
- Svelte adapter
- CLI tool for scaffolding
