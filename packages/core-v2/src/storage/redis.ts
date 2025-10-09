import type { Storage } from '@/schemas/storage'

export type RedisClient = {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string) => Promise<unknown>
  setEx: (key: string, seconds: number, value: string) => Promise<unknown>
  del: (key: string) => Promise<unknown>
}

export type RedisStorageOptions = {
  keyPrefix?: string
  defaultTTL?: number
}

/**
 * Redis storage implementation
 *
 * @example Basic usage
 * ```ts
 * import { createClient } from 'redis'
 * import { redisStorage } from '@bloom/core/storage/redis'
 *
 * const redis = createClient({ url: process.env.REDIS_URL })
 * await redis.connect()
 *
 * const auth = bloomAuth({
 *   adapter: drizzleAdapter(db),
 *   storage: redisStorage(redis),
 * })
 * ```
 *
 * @example With options
 * ```ts
 * storage: redisStorage(redis, {
 *   keyPrefix: 'bloom:',
 *   defaultTTL: 3600,
 * })
 * ```
 */
export function redisStorage(client: RedisClient, options?: RedisStorageOptions): Storage {
  const prefix = options?.keyPrefix || ''
  const defaultTTL = options?.defaultTTL

  const prefixKey = (key: string) => `${prefix}${key}`

  return {
    async get(key: string): Promise<string | null> {
      return await client.get(prefixKey(key))
    },

    async set(key: string, value: string, ttl?: number): Promise<void> {
      const finalTTL = ttl ?? defaultTTL
      const prefixedKey = prefixKey(key)

      if (finalTTL) {
        await client.setEx(prefixedKey, finalTTL, value)
      } else {
        await client.set(prefixedKey, value)
      }
    },

    async delete(key: string): Promise<void> {
      await client.del(prefixKey(key))
    },
  }
}
