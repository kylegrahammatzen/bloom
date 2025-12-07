import { MongoClient } from 'mongodb'

const DATABASE_URL = 'mongodb://bloom:bloom-dev-password@localhost:27017?authSource=admin'
const DATABASE_NAME = 'bloom-auth-v2'

const client = new MongoClient(DATABASE_URL, {
  serverSelectionTimeoutMS: 1000,
  connectTimeoutMS: 1000,
})

try {
  await client.connect()
  console.log('[Database] Connected to MongoDB')

  const db = client.db(DATABASE_NAME)
  await db.dropDatabase()
  console.log(`[Database] Dropped database: ${DATABASE_NAME}`)

  console.log('[Database] Database reset complete')
} catch (error) {
  console.error('[Database] Reset failed:', error.message)
  process.exit(1)
} finally {
  await client.close()
}
