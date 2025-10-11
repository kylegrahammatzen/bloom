# Express Server V2

Express.js server using Bloom Auth V2 with MongoDB.

## Features

- **Bloom Auth V2** - Authentication with `@bloom/core-v2` and `@bloom/adapters-v2`
- **MongoDB** - Database with MongoDB adapter
- **Rate Limiting** - Built-in rate limiting per endpoint
- **Hooks** - Path-based hooks for custom logic
- **Logger** - Configurable logging with different levels

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - MongoDB connection string
- `PORT` - Server port (default: 5002)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Frontend URL for CORS

### 3. Start MongoDB

Make sure MongoDB is running locally or use a cloud instance:

```bash
# Using Docker
docker run -d -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=bloom \
  -e MONGO_INITDB_ROOT_PASSWORD=bloom-dev-password \
  --name mongodb mongo:latest
```

### 4. Run Development Server

```bash
pnpm dev
```

Server will start at `http://localhost:5002`

## API Routes

All authentication routes are under `/auth`:

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout current session
- `GET /auth/session` - Get current session
- `GET /auth/sessions` - Get all user sessions
- `DELETE /auth/sessions/:id` - Delete specific session
- `DELETE /auth/sessions` - Delete all sessions except current
- `POST /auth/send-verification-email` - Send email verification
- `POST /auth/verify-email` - Verify email with token
- `POST /auth/request-password-reset` - Request password reset
- `POST /auth/reset-password` - Reset password with token

## Configuration

See `src/lib/auth.ts` for auth configuration:

- **Email/Password** - Enabled with min 8 characters
- **Sessions** - 7 day expiry, updates every 24 hours
- **Rate Limiting** - 100 requests/min globally, stricter on auth routes
- **Hooks** - Console logs on register/login events

## Testing

```bash
# Register a user
curl -X POST http://localhost:5002/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:5002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Get session
curl http://localhost:5002/auth/session -b cookies.txt

# Logout
curl -X POST http://localhost:5002/auth/logout -b cookies.txt
```

## Project Structure

```
src/
├── index.ts        # Express server setup
└── lib/
    ├── db.ts       # MongoDB connection
    └── auth.ts     # Bloom auth configuration
```

## License

GNU Affero General Public License v3.0
