<img src="../../../../.github/banner.png" width="100%" alt="Bloom Banner" />

# Bloom Core V2 - MongoDB Adapter

Database adapter for MongoDB NoSQL database.

## Installation

```bash
pnpm add mongodb
```

## Usage

```typescript
import { MongoClient } from 'mongodb'
import { mongodbAdapter } from '@bloom/core-v2/adapters/mongodb'
import { bloomAuth } from '@bloom/core-v2'

const client = new MongoClient('mongodb://localhost:27017')
await client.connect()
const db = client.db('auth')

export const auth = bloomAuth({
  adapter: mongodbAdapter(db),
})
```

## Configuration

### Custom Collection Names

```typescript
export const auth = bloomAuth({
  adapter: mongodbAdapter(db, {
    collections: {
      users: 'auth_users',
      sessions: 'auth_sessions',
    },
  }),
})
```

### MongoDB Atlas

```typescript
import { MongoClient } from 'mongodb'
import { mongodbAdapter } from '@bloom/core-v2/adapters/mongodb'
import { bloomAuth } from '@bloom/core-v2'

const uri = process.env.MONGODB_URI // MongoDB Atlas connection string
const client = new MongoClient(uri)

await client.connect()
const db = client.db('auth')

export const auth = bloomAuth({
  adapter: mongodbAdapter(db),
})
```

## Schema

MongoDB automatically creates collections. Documents follow this structure:

### Users Collection

```typescript
{
  _id: string           // Primary key
  email: string         // Unique, indexed
  password_hash: string
  password_salt: string
  email_verified: boolean
  name: string | null
  image: string | null
  created_at: Date
  updated_at: Date
  last_login: Date | null
}
```

### Sessions Collection

```typescript
{
  _id: string           // Primary key
  user_id: string       // References users._id
  expires_at: Date      // Indexed for expiration queries
  created_at: Date
  last_accessed_at: Date
}
```

## Indexes

Create indexes for better performance:

```typescript
import { MongoClient } from 'mongodb'

const client = new MongoClient('mongodb://localhost:27017')
await client.connect()
const db = client.db('auth')

// Users indexes
await db.collection('users').createIndex({ email: 1 }, { unique: true })

// Sessions indexes
await db.collection('sessions').createIndex({ user_id: 1 })
await db.collection('sessions').createIndex({ expires_at: 1 })
```

Or using MongoDB shell:

```javascript
use auth

db.users.createIndex({ "email": 1 }, { unique: true })
db.sessions.createIndex({ "user_id": 1 })
db.sessions.createIndex({ "expires_at": 1 })
```

## Connection URI Examples

### Local MongoDB

```
mongodb://localhost:27017
```

### MongoDB Atlas

```
mongodb+srv://username:password@cluster.mongodb.net/
```

### MongoDB with Authentication

```
mongodb://username:password@localhost:27017/auth?authSource=admin
```

### MongoDB Replica Set

```
mongodb://host1:27017,host2:27017,host3:27017/?replicaSet=rs0
```

## Error Handling

```typescript
import { MongoClient } from 'mongodb'
import { mongodbAdapter } from '@bloom/core-v2/adapters/mongodb'
import { bloomAuth } from '@bloom/core-v2'

let client: MongoClient

try {
  client = new MongoClient(process.env.MONGODB_URI!)
  await client.connect()

  const db = client.db('auth')

  export const auth = bloomAuth({
    adapter: mongodbAdapter(db),
  })
} catch (error) {
  console.error('MongoDB connection failed:', error)
  throw error
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await client?.close()
  process.exit(0)
})
```

## Notes

Email addresses are automatically normalized to lowercase.

Expired sessions are filtered automatically in queries. Use `adapter.session.deleteExpired()` to clean up.

MongoDB uses `_id` as the primary key field, which is mapped to `id` in the returned objects.

For production, create appropriate indexes for email and session queries.

## License

This project is licensed under the GNU Affero General Public License v3.0.
