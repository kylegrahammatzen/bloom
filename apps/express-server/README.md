# Bloom Server

<div align="center">

[![License: AGPL](https://img.shields.io/badge/License-AGPL-red.svg)](../LICENSE)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-green.svg)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.7-green.svg)](https://www.mongodb.com/)
[![Argon2](https://img.shields.io/badge/Argon2-0.40-red.svg)](https://www.npmjs.com/package/argon2)

</div>

Express.js TypeScript backend for Bloom, an open-source project to show how authentication really works.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Start MongoDB (from project root):
   ```bash
   npm run docker:up
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Run tests with Vitest
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run linting
npm run lint
```

## API Endpoints

### Authentication Routes (/api/auth)
- POST /register - User registration with password strength validation
- POST /login - User authentication with rate limiting
- POST /logout - Session termination
- GET /me - Get current user information
- POST /verify-email - Email verification with tokens
- POST /request-password-reset - Password reset request
- POST /reset-password - Password reset with new password

### Laboratory Routes (/api/lab)
- POST /password-comparison - Compare different password storage methods
- POST /token-analysis - Analyze token generation and entropy
- POST /session-demo - Demonstrate session lifecycle
- POST /attack-simulation - Safe security attack demonstrations

### Health Check
- GET /api/health - Service health status

## Security Features

- Argon2id password hashing with proper salt generation
- Cryptographically secure token generation (120-bit entropy)
- Session management with HttpOnly, SameSite, and Secure cookies
- Rate limiting on authentication endpoints
- CSRF protection through SameSite cookies
- Account lockout after failed login attempts
- Input validation and sanitization

## Tech Stack

- Express.js with TypeScript
- MongoDB with Mongoose ODM
- Argon2 for password hashing
- Express Session for session management
- Express Rate Limit for protection
- Express Validator for input validation
- Helmet for security headers
- CORS for cross-origin requests

## Project Structure

```
server/
├── src/
│   ├── config/          # Database configuration
│   ├── middleware/      # Express middleware (auth, rate limiting, errors)
│   ├── models/         # Mongoose schemas (User, Session, Token)
│   ├── routes/         # API route handlers
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions (auth helpers)
│   └── index.ts        # Application entry point
├── scripts/            # Database initialization scripts
├── .env.example        # Environment variables template
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── nodemon.json        # Development server configuration
```

## Environment Variables

```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://bloom:bloom-dev-password@localhost:27017/bloom-auth
SESSION_SECRET=your-super-secret-session-key-change-in-production
FRONTEND_URL=http://localhost:3000
```

## Database Setup

The server automatically connects to MongoDB on startup. No manual schema creation is required - Mongoose will automatically create collections when documents are first inserted.

### Database Connection
- Connects to MongoDB using Mongoose ODM
- Automatic connection pooling and error handling
- Collections are created dynamically when first used
- Indexes are automatically created based on schema definitions

For detailed database schema information, see [schema.md](schema.md).

## Testing

The server includes comprehensive tests using Vitest:

- Unit Tests: Authentication utilities, middleware functions, database models
- Integration Tests: Complete API endpoint testing with MongoDB Memory Server
- Security Tests: Password hashing, rate limiting, session management
- Coverage: All core authentication flows and edge cases

```bash
# Run all tests
npm test

# Run tests in watch mode for development
npm run test:watch

# Run tests with interactive UI
npm run test:ui
```

## Development Notes

- Database Schema: MongoDB collections are created automatically on startup
- Type Safety: All routes include proper TypeScript typing
- Security: Rate limiting prevents brute force attacks
- Education: Laboratory endpoints demonstrate security concepts safely
- Standards: Follows Copenhagen Book security recommendations
- Testing: Comprehensive test suite with Vitest and MongoDB Memory Server