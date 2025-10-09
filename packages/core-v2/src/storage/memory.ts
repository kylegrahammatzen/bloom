import type { Storage } from '@/schemas/storage'

type StorageEntry = {
  value: string
  expiresAt?: number
}

/**
 * In-memory storage implementation
 *
 * WARNING: Only use for local development and traditional servers.
 * Does NOT work in serverless environments (Vercel, Netlify, etc.)
 * where each request gets a new instance.
 *
 * For production, use redisStorage() instead.
 *
 * @example
 * ```ts
 * import { memoryStorage } from '@bloom/core/storage/memory'
 *
 * const auth = bloomAuth({
 *   adapter: drizzleAdapter(db),
 *   storage: memoryStorage(),
 * })
 * ```
 */
export function memoryStorage(): Storage {
  const store = new Map<string, StorageEntry>()

  return {
    async get(key: string): Promise<string | null> {
      const entry = store.get(key)

      if (!entry) {
        return null
      }

      // Check if expired
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        store.delete(key)
        return null
      }

      return entry.value
    },

    async set(key: string, value: string, ttl?: number): Promise<void> {
      const entry: StorageEntry = {
        value,
        expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
      }

      store.set(key, entry)
    },

    async delete(key: string): Promise<void> {
      store.delete(key)
    },
  }
}
