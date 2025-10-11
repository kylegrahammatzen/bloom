# Express Server V2

Express.js server using Bloom Auth V2 with MongoDB.

## Setup

Install dependencies:

```bash
pnpm install
```

Start MongoDB (from project root):

```bash
pnpm docker:up
```

The `.env` file is already configured for `bloom-auth-v2` database.

Run development server:

```bash
pnpm dev
```

Server runs at `http://localhost:5002`

Reset database:

```bash
pnpm db:reset
```

## Testing

Register a user:

```bash
curl -X POST http://localhost:5002/auth/register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

Login:

```bash
curl -X POST http://localhost:5002/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123"}' -c cookies.txt
```

Get session:

```bash
curl http://localhost:5002/auth/session -b cookies.txt
```

Logout:

```bash
curl -X POST http://localhost:5002/auth/logout -b cookies.txt
```

## License

GNU Affero General Public License v3.0
