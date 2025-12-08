import { MongoClient } from 'mongodb'

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://bloom:bloom-dev-password@localhost:27017/bloom-auth-v2?authSource=admin'

async function resetDatabase() {
  const client = new MongoClient(DATABASE_URL)

  try {
    await client.connect()
    console.log('[Reset] Connected to MongoDB')

    const db = client.db('bloom-auth-v2')

    // Drop collections
    const collections = await db.listCollections().toArray()
    for (const collection of collections) {
      await db.dropCollection(collection.name)
      console.log(`[Reset] Dropped collection: ${collection.name}`)
    }

    console.log('[Reset] Database reset complete')
  } catch (error) {
    console.error('[Reset] Error:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

resetDatabase()
