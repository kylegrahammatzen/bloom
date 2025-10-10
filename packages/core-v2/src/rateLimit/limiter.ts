import type { Storage, RateLimitConfig } from '@/schemas'
import type { DatabaseAdapter } from '@/storage/adapter'
import type { Context } from '@/handler/context'

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  retryAfter?: number
}

export type RateLimiterConfig = {
  config: RateLimitConfig
  storage?: Storage
  adapter: DatabaseAdapter
}

/**
 * Rate limiter with auto-detection (storage > database > memory)
 */
export class RateLimiter {
  private config: RateLimitConfig
  private storage?: Storage
  private adapter: DatabaseAdapter
  private memoryStore: Map<string, { count: number; resetAt: number }> = new Map()

  constructor({ config, storage, adapter }: RateLimiterConfig) {
    this.config = config
    this.storage = storage
    this.adapter = adapter

    // Warn if using memory in production without storage or database
    if (!storage && !adapter.rateLimit && process.env.NODE_ENV === 'production') {
      console.warn(
        '[Bloom] Rate limiting using in-memory storage in production. ' +
        'Consider providing storage (Redis/Memory) or implementing adapter.rateLimit methods.'
      )
    }
  }

  /**
   * Check if request is allowed based on rate limit
   */
  async check(ctx: Context): Promise<RateLimitResult> {
    // Check if rate limiting is enabled
    const enabled = this.config.enabled ?? process.env.NODE_ENV === 'production'
    if (!enabled) {
      return { allowed: true, limit: this.config.max, remaining: this.config.max }
    }

    // Get rule for this path
    const rule = await this.getRule(ctx)

    // If rule is false, rate limiting is disabled for this path
    if (rule === false) {
      return { allowed: true, limit: this.config.max, remaining: this.config.max }
    }

    const { window, max } = rule

    // Extract identifier (IP address)
    const identifier = this.extractIdentifier(ctx)

    // Build rate limit key
    const key = `ip:${identifier}:${ctx.path}`

    // Check rate limit based on available strategy
    if (this.storage) {
      return await this.checkWithStorage(key, window, max)
    } else if (this.adapter.rateLimit) {
      return await this.adapter.rateLimit.increment(key, window, max)
    } else {
      return await this.checkWithMemory(key, window, max)
    }
  }

  /**
   * Get rule for current path
   */
  private async getRule(ctx: Context): Promise<{ window: number; max: number } | false> {
    if (!this.config.rules) {
      return { window: this.config.window, max: this.config.max }
    }

    // Check for exact match first
    const exactRule = this.config.rules[ctx.path]
    if (exactRule !== undefined) {
      if (exactRule === false) {
        return false
      }
      if (typeof exactRule === 'function') {
        return await exactRule(ctx)
      }
      return exactRule
    }

    // Check for wildcard matches
    for (const [pattern, rule] of Object.entries(this.config.rules)) {
      if (this.matchWildcard(pattern, ctx.path)) {
        if (rule === false) {
          return false
        }
        if (typeof rule === 'function') {
          return await rule(ctx)
        }
        return rule
      }
    }

    // Use default rule
    return { window: this.config.window, max: this.config.max }
  }

  /**
   * Match wildcard pattern
   */
  private matchWildcard(pattern: string, path: string): boolean {
    if (!pattern.includes('*')) {
      return false
    }

    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\//g, '\\/')

    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(path)
  }

  /**
   * Extract identifier from context
   */
  private extractIdentifier(ctx: Context): string {
    const ipHeaders = this.config.ipHeaders ?? ['x-forwarded-for', 'cf-connecting-ip', 'x-real-ip']

    for (const header of ipHeaders) {
      const value = ctx.headers.get(header)
      if (value) {
        // x-forwarded-for can be comma-separated, take first IP
        return value.split(',')[0].trim()
      }
    }

    // Fallback to 'unknown' if no IP found
    return 'unknown'
  }

  /**
   * Check rate limit using storage (Redis/Memory)
   */
  private async checkWithStorage(
    key: string,
    window: number,
    max: number
  ): Promise<RateLimitResult> {
    if (!this.storage) {
      throw new Error('Storage not available')
    }

    const now = Date.now()
    const windowMs = window * 1000

    try {
      // Get current data
      const data = await this.storage.get(key)

      if (!data) {
        // First request
        await this.storage.set(key, JSON.stringify({ count: 1, resetAt: now + windowMs }), window)
        return { allowed: true, limit: max, remaining: max - 1 }
      }

      const parsed = JSON.parse(data) as { count: number; resetAt: number }

      // Check if window has expired
      if (now >= parsed.resetAt) {
        // Reset window
        await this.storage.set(key, JSON.stringify({ count: 1, resetAt: now + windowMs }), window)
        return { allowed: true, limit: max, remaining: max - 1 }
      }

      // Increment count
      const newCount = parsed.count + 1
      await this.storage.set(key, JSON.stringify({ count: newCount, resetAt: parsed.resetAt }), window)

      const allowed = newCount <= max
      const remaining = Math.max(0, max - newCount)
      const retryAfter = allowed ? undefined : Math.ceil((parsed.resetAt - now) / 1000)

      return { allowed, limit: max, remaining, retryAfter }
    } catch (error) {
      console.error('[Bloom] Rate limit storage error:', error)
      // Allow request on error
      return { allowed: true, limit: max, remaining: max }
    }
  }

  /**
   * Check rate limit using memory (dev only)
   */
  private async checkWithMemory(
    key: string,
    window: number,
    max: number
  ): Promise<RateLimitResult> {
    const now = Date.now()
    const windowMs = window * 1000

    const existing = this.memoryStore.get(key)

    if (!existing || now >= existing.resetAt) {
      // First request or window expired
      this.memoryStore.set(key, { count: 1, resetAt: now + windowMs })
      return { allowed: true, limit: max, remaining: max - 1 }
    }

    // Increment count
    const newCount = existing.count + 1
    this.memoryStore.set(key, { count: newCount, resetAt: existing.resetAt })

    const allowed = newCount <= max
    const remaining = Math.max(0, max - newCount)
    const retryAfter = allowed ? undefined : Math.ceil((existing.resetAt - now) / 1000)

    return { allowed, limit: max, remaining, retryAfter }
  }

  /**
   * Cleanup expired rate limit records (for database strategy)
   */
  async cleanup(): Promise<number> {
    if (this.adapter.rateLimit) {
      return await this.adapter.rateLimit.cleanup()
    }

    // Cleanup memory store
    const now = Date.now()
    let count = 0
    for (const [key, data] of this.memoryStore.entries()) {
      if (now >= data.resetAt) {
        this.memoryStore.delete(key)
        count++
      }
    }

    return count
  }
}
