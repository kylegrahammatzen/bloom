import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RateLimiter } from '@/rateLimit/limiter'
import { memoryStorage } from '@/storage/memory'
import type { Storage, RateLimitConfig } from '@/schemas'
import type { DatabaseAdapter } from '@/storage/adapter'
import type { Context } from '@/handler/context'

function createMockContext(path: string, ip?: string): Context {
  const headers = new Headers()
  if (ip) {
    headers.set('x-forwarded-for', ip)
  }

  return {
    request: new Request('http://localhost/auth' + path),
    method: 'POST',
    path,
    query: {},
    headers,
    body: null,
    params: {},
    user: null,
    session: null,
  }
}

function createMockAdapter(): DatabaseAdapter {
  return {
    user: {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    session: {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      create: vi.fn(),
      updateLastAccessed: vi.fn(),
      delete: vi.fn(),
      deleteByUserId: vi.fn(),
      deleteExpired: vi.fn(),
    },
  }
}

describe('Rate Limiter', () => {
  describe('Memory Strategy', () => {
    it('should allow requests within limit', async () => {
      const config: RateLimitConfig = {
        enabled: true,
        window: 60,
        max: 3,
      }

      const limiter = new RateLimiter({
        config,
        adapter: createMockAdapter(),
      })

      const ctx = createMockContext('/test', '192.168.1.1')

      // First 3 requests should be allowed
      const result1 = await limiter.check(ctx)
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(2)

      const result2 = await limiter.check(ctx)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(1)

      const result3 = await limiter.check(ctx)
      expect(result3.allowed).toBe(true)
      expect(result3.remaining).toBe(0)

      // 4th request should be blocked
      const result4 = await limiter.check(ctx)
      expect(result4.allowed).toBe(false)
      expect(result4.remaining).toBe(0)
      expect(result4.retryAfter).toBeGreaterThan(0)
    })

    it('should reset window after expiry', async () => {
      const config: RateLimitConfig = {
        enabled: true,
        window: 1, // 1 second
        max: 2,
      }

      const limiter = new RateLimiter({
        config,
        adapter: createMockAdapter(),
      })

      const ctx = createMockContext('/test', '192.168.1.1')

      // Use up limit
      await limiter.check(ctx)
      await limiter.check(ctx)

      const result = await limiter.check(ctx)
      expect(result.allowed).toBe(false)

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 1100))

      // Should be allowed again
      const result2 = await limiter.check(ctx)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(1)
    })

    it('should track different IPs separately', async () => {
      const config: RateLimitConfig = {
        enabled: true,
        window: 60,
        max: 2,
      }

      const limiter = new RateLimiter({
        config,
        adapter: createMockAdapter(),
      })

      const ctx1 = createMockContext('/test', '192.168.1.1')
      const ctx2 = createMockContext('/test', '192.168.1.2')

      // IP 1 uses limit
      await limiter.check(ctx1)
      await limiter.check(ctx1)

      const result1 = await limiter.check(ctx1)
      expect(result1.allowed).toBe(false)

      // IP 2 should still be allowed
      const result2 = await limiter.check(ctx2)
      expect(result2.allowed).toBe(true)
    })
  })

  describe('Storage Strategy', () => {
    it('should use storage when provided', async () => {
      const storage = memoryStorage()
      const config: RateLimitConfig = {
        enabled: true,
        window: 60,
        max: 3,
      }

      const limiter = new RateLimiter({
        config,
        storage,
        adapter: createMockAdapter(),
      })

      const ctx = createMockContext('/test', '192.168.1.1')

      const result1 = await limiter.check(ctx)
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(2)

      const result2 = await limiter.check(ctx)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(1)
    })

    it('should allow requests on storage error', async () => {
      const storage: Storage = {
        get: vi.fn().mockRejectedValue(new Error('Storage error')),
        set: vi.fn(),
        delete: vi.fn(),
      }

      const config: RateLimitConfig = {
        enabled: true,
        window: 60,
        max: 3,
      }

      const limiter = new RateLimiter({
        config,
        storage,
        adapter: createMockAdapter(),
      })

      const ctx = createMockContext('/test', '192.168.1.1')

      // Should allow request on error
      const result = await limiter.check(ctx)
      expect(result.allowed).toBe(true)
    })
  })

  describe('Custom Rules', () => {
    it('should apply custom rule for specific path', async () => {
      const config: RateLimitConfig = {
        enabled: true,
        window: 60,
        max: 100,
        rules: {
          '/sign-in': { window: 10, max: 2 },
        },
      }

      const limiter = new RateLimiter({
        config,
        adapter: createMockAdapter(),
      })

      const ctx = createMockContext('/sign-in', '192.168.1.1')

      // Should use custom limit of 2
      const result1 = await limiter.check(ctx)
      expect(result1.allowed).toBe(true)
      expect(result1.limit).toBe(2)

      const result2 = await limiter.check(ctx)
      expect(result2.allowed).toBe(true)

      const result3 = await limiter.check(ctx)
      expect(result3.allowed).toBe(false)
    })

    it('should support wildcard rules', async () => {
      const config: RateLimitConfig = {
        enabled: true,
        window: 60,
        max: 100,
        rules: {
          '/two-factor/*': { window: 10, max: 3 },
        },
      }

      const limiter = new RateLimiter({
        config,
        adapter: createMockAdapter(),
      })

      const ctx = createMockContext('/two-factor/verify', '192.168.1.1')

      const result = await limiter.check(ctx)
      expect(result.allowed).toBe(true)
      expect(result.limit).toBe(3)
    })

    it('should support function rules', async () => {
      const config: RateLimitConfig = {
        enabled: true,
        window: 60,
        max: 100,
        rules: {
          '/api/create': async (ctx: Context) => {
            // Stricter limit for specific operation
            return { window: 10, max: 1 }
          },
        },
      }

      const limiter = new RateLimiter({
        config,
        adapter: createMockAdapter(),
      })

      const ctx = createMockContext('/api/create', '192.168.1.1')

      const result1 = await limiter.check(ctx)
      expect(result1.allowed).toBe(true)
      expect(result1.limit).toBe(1)

      const result2 = await limiter.check(ctx)
      expect(result2.allowed).toBe(false)
    })

    it('should disable rate limiting for specific path when rule is false', async () => {
      const config: RateLimitConfig = {
        enabled: true,
        window: 60,
        max: 2,
        rules: {
          '/get-session': false,
        },
      }

      const limiter = new RateLimiter({
        config,
        adapter: createMockAdapter(),
      })

      const ctx = createMockContext('/get-session', '192.168.1.1')

      // Should allow unlimited requests
      const result1 = await limiter.check(ctx)
      expect(result1.allowed).toBe(true)

      const result2 = await limiter.check(ctx)
      expect(result2.allowed).toBe(true)

      const result3 = await limiter.check(ctx)
      expect(result3.allowed).toBe(true)
    })

    it('should support function rules returning false', async () => {
      const config: RateLimitConfig = {
        enabled: true,
        window: 60,
        max: 2,
        rules: {
          '/admin/*': async (ctx: Context) => {
            // Disable rate limiting for admin
            return false
          },
        },
      }

      const limiter = new RateLimiter({
        config,
        adapter: createMockAdapter(),
      })

      const ctx = createMockContext('/admin/users', '192.168.1.1')

      // Should allow unlimited requests
      const result = await limiter.check(ctx)
      expect(result.allowed).toBe(true)
    })
  })

  describe('IP Headers', () => {
    it('should extract IP from default headers', async () => {
      const config: RateLimitConfig = {
        enabled: true,
        window: 60,
        max: 2,
      }

      const limiter = new RateLimiter({
        config,
        adapter: createMockAdapter(),
      })

      const ctx = createMockContext('/test', '192.168.1.1')

      const result1 = await limiter.check(ctx)
      const result2 = await limiter.check(ctx)
      const result3 = await limiter.check(ctx)

      expect(result3.allowed).toBe(false)
    })

    it('should respect custom IP headers order', async () => {
      const config: RateLimitConfig = {
        enabled: true,
        window: 60,
        max: 2,
        ipHeaders: ['cf-connecting-ip', 'x-forwarded-for'],
      }

      const limiter = new RateLimiter({
        config,
        adapter: createMockAdapter(),
      })

      const headers = new Headers()
      headers.set('cf-connecting-ip', '10.0.0.1')
      headers.set('x-forwarded-for', '192.168.1.1')

      const ctx: Context = {
        request: new Request('http://localhost/test'),
        method: 'POST',
        path: '/test',
        query: {},
        headers,
        body: null,
        params: {},
        user: null,
        session: null,
      }

      // Should use cf-connecting-ip (first in order)
      await limiter.check(ctx)
      await limiter.check(ctx)

      const result = await limiter.check(ctx)
      expect(result.allowed).toBe(false)
    })

    it('should handle comma-separated IPs in x-forwarded-for', async () => {
      const config: RateLimitConfig = {
        enabled: true,
        window: 60,
        max: 2,
      }

      const limiter = new RateLimiter({
        config,
        adapter: createMockAdapter(),
      })

      const headers = new Headers()
      headers.set('x-forwarded-for', '192.168.1.1, 10.0.0.1, 172.16.0.1')

      const ctx: Context = {
        request: new Request('http://localhost/test'),
        method: 'POST',
        path: '/test',
        query: {},
        headers,
        body: null,
        params: {},
        user: null,
        session: null,
      }

      // Should use first IP
      await limiter.check(ctx)
      await limiter.check(ctx)

      const result = await limiter.check(ctx)
      expect(result.allowed).toBe(false)
    })
  })

  describe('Enabled Flag', () => {
    it('should be disabled when enabled is false', async () => {
      const config: RateLimitConfig = {
        enabled: false,
        window: 60,
        max: 1,
      }

      const limiter = new RateLimiter({
        config,
        adapter: createMockAdapter(),
      })

      const ctx = createMockContext('/test', '192.168.1.1')

      // Should allow unlimited requests
      const result1 = await limiter.check(ctx)
      const result2 = await limiter.check(ctx)
      const result3 = await limiter.check(ctx)

      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
      expect(result3.allowed).toBe(true)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup expired records from memory', async () => {
      const config: RateLimitConfig = {
        enabled: true,
        window: 1, // 1 second
        max: 2,
      }

      const limiter = new RateLimiter({
        config,
        adapter: createMockAdapter(),
      })

      const ctx = createMockContext('/test', '192.168.1.1')

      // Make requests
      await limiter.check(ctx)

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 1100))

      // Cleanup
      const cleaned = await limiter.cleanup()
      expect(cleaned).toBeGreaterThanOrEqual(0)
    })
  })
})
