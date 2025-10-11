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

## License

GNU Affero General Public License v3.0
