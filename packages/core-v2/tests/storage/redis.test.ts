import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { redisStorage } from '@/storage/redis'
import type { Storage } from '@/schemas/storage'
import { createClient } from 'redis'
import type { RedisClientType } from 'redis'

/**
 * Redis storage tests
 *
 * The tests require redis package and a running Redis instance:
 * 1. pnpm add -D redis
 * 2. docker run -p 6379:6379 redis
 * 3. Set REDIS_URL in .env (defaults to redis://localhost:6379)
 */

describe('redisStorage', () => {
  let storage: Storage
  let redis: RedisClientType
  let skipTests = false

  beforeAll(async () => {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      redis = createClient({ url: redisUrl, socket: { connectTimeout: 2000 } })
      await redis.connect()
      storage = redisStorage(redis, { keyPrefix: 'test:' })
    } catch (error) {
      console.log('Redis not available, skipping tests')
      skipTests = true
    }
  })

  afterAll(async () => {
    if (redis && !skipTests) {
      await redis.quit()
    }
  })

  it('should store and retrieve values', async () => {
    if (skipTests) return
    await storage.set('key1', 'value1')
    expect(await storage.get('key1')).toBe('value1')
    await storage.delete('key1')
  })

  it('should use key prefix', async () => {
    if (skipTests) return
    await storage.set('key1', 'value1')
    const rawValue = await redis.get('test:key1')
    expect(rawValue).toBe('value1')
    await storage.delete('key1')
  })

  it('should respect TTL', async () => {
    if (skipTests) return
    await storage.set('key1', 'value1', 1)
    await new Promise(r => setTimeout(r, 1100))
    expect(await storage.get('key1')).toBeNull()
  })
})
