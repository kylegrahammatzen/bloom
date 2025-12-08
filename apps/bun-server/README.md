# Bun Server

Bun native HTTP server with Bloom Auth and MongoDB.

## Setup

```bash
bun install
```

Start MongoDB (from project root):

```bash
bun docker:up
```

Run development server:

```bash
bun dev
```

Server runs at `http://localhost:5003`

Reset database:

```bash
bun db:reset
```

## Testing

Register a user:

```bash
curl -X POST http://localhost:5003/auth/register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

Login:

```bash
curl -X POST http://localhost:5003/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123"}' -c cookies.txt
```

Get session:

```bash
curl http://localhost:5003/auth/session -b cookies.txt
```

Logout:

```bash
curl -X POST http://localhost:5003/auth/logout -b cookies.txt
```

## License

GNU Affero General Public License v3.0
