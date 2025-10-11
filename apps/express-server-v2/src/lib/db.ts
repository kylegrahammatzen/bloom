import { MongoClient } from 'mongodb'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

const client = new MongoClient(process.env.DATABASE_URL)

// Connect on startup
client.connect()
  .then(() => console.log('[Database] Connected to MongoDB'))
  .catch((err) => {
    console.error('[Database] Failed to connect to MongoDB:', err)
    process.exit(1)
  })

// Cleanup on process exit
process.on('SIGINT', async () => {
  await client.close()
  process.exit(0)
})

export const db = client.db('bloom-auth-v2')
