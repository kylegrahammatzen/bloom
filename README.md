# Bloom

<div align="center">

[![License: AGPL](https://img.shields.io/badge/License-AGPL-red.svg)](LICENSE)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.7-green.svg)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-green.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-17-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

</div>

Bloom is an open-source project to show how authentication really works.

## Getting Started

1. Clone and configure:

   ```bash
   git clone https://github.com/kylegrahammatzen/bloom.git
   cd bloom
   cp server/.env.example server/.env
   ```

2. Start MongoDB with Docker:

   ```bash
   npm run docker:up
   ```

3. Install dependencies and start development servers:

   ```bash
   # Install all dependencies
   npm run install:all

   # Start both frontend and backend
   npm run dev
   ```

## Features

- Icebox laboratory for experimenting with different authentication methods
- Real-time visualization of authentication processes
- Three security scenarios (banking, social media, payment processing)
- Safe environment for testing attacks and inspecting tokens/cookies
- Step-by-step demonstration of password hashing, session management, and CSRF protection

## Tech Stack

- React with TypeScript and Tailwind CSS
- Express.js with TypeScript backend
- MongoDB with Mongoose ODM
- Argon2id for password hashing
- Express session management with rate limiting
- Docker for MongoDB development environment

## Project Structure

```
bloom/
├── frontend/          # React TypeScript application
├── server/           # Express.js TypeScript backend
├── docker-compose.yml # MongoDB and services
└── package.json      # Root workspace configuration
```

## Development

```bash
# Start frontend only
npm run dev:frontend

# Start backend only
npm run dev:server

# Build for production
npm run build

# Run linting
npm run lint
```

## License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
