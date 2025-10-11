# Express Server V2

Express.js server using Bloom Auth V2 with MongoDB.

## Setup

1. **Start MongoDB** (from project root):
```bash
pnpm docker:up
```

2. **Install dependencies and configure**:
```bash
pnpm install
```

The `.env` file is already created with MongoDB connection to `bloom-auth-v2` database.

3. **Start the development server**:
```bash
pnpm dev
```

Server runs at `http://localhost:5002` with auth routes at `/auth/*`

## Database Management

**Reset/Clear the database:**
```bash
# From project root
pnpm docker:down -v        # Stop and remove volumes (clears all data)
pnpm docker:up             # Start fresh
```

**View MongoDB logs:**
```bash
# From project root
pnpm docker:logs
```

**Connect to MongoDB shell:**
```bash
docker exec -it bloom-mongodb mongosh -u bloom -p bloom-dev-password --authenticationDatabase admin
use bloom-auth-v2
db.users.find()            # View all users
db.sessions.find()         # View all sessions
db.dropDatabase()          # Drop entire database
```

## License

GNU Affero General Public License v3.0
