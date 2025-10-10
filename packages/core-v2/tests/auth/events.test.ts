import { describe, it, expect, vi } from 'vitest'
import { bloomAuth } from '@/auth'
import type { DatabaseAdapter } from '@/storage/adapter'
import type { User, Session } from '@/types'

// Mock adapter for testing
const createMockAdapter = (): DatabaseAdapter => ({
  user: {
    findById: vi.fn(async (id: string): Promise<User | null> => ({
      id,
      email: 'test@example.com',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    })),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  session: {
    findById: vi.fn(async (id: string): Promise<Session | null> => ({
      id,
      userId: 'user123',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    })),
    findByUserId: vi.fn(),
    create: vi.fn(),
    updateLastAccessed: vi.fn(),
    delete: vi.fn(),
    deleteByUserId: vi.fn(),
    deleteExpired: vi.fn(),
  },
})

describe('Event System', () => {
  describe('Basic Functionality', () => {
    it('should register and emit events', async () => {
      const adapter = createMockAdapter()
      const auth = bloomAuth({ adapter })

      const handler = vi.fn()
      auth.on('test:event', handler)

      await auth.emit('test:event', { data: 'test' })

      expect(handler).toHaveBeenCalledWith({ data: 'test' })
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should support multiple listeners on same event', async () => {
      const adapter = createMockAdapter()
      const auth = bloomAuth({ adapter })

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      auth.on('test:event', handler1)
      auth.on('test:event', handler2)
      auth.on('test:event', handler3)

      await auth.emit('test:event', { data: 'test' })

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
      expect(handler3).toHaveBeenCalledTimes(1)
    })

    it('should remove event listeners with off()', async () => {
      const adapter = createMockAdapter()
      const auth = bloomAuth({ adapter })

      const handler = vi.fn()
      auth.on('test:event', handler)

      await auth.emit('test:event', { data: 'test' })
      expect(handler).toHaveBeenCalledTimes(1)

      auth.off('test:event', handler)

      await auth.emit('test:event', { data: 'test' })
      expect(handler).toHaveBeenCalledTimes(1) // Still 1, not called again
    })

    it('should list registered events', () => {
      const adapter = createMockAdapter()
      const auth = bloomAuth({ adapter })

      auth.on('event1', vi.fn())
      auth.on('event2', vi.fn())
      auth.on('event3', vi.fn())

      const events = auth.events.list()

      expect(events).toContain('event1')
      expect(events).toContain('event2')
      expect(events).toContain('event3')
      expect(events).toHaveLength(3)
    })

    it('should get listeners for specific event', () => {
      const adapter = createMockAdapter()
      const auth = bloomAuth({ adapter })

      const handler1 = vi.fn()
      const handler2 = vi.fn()

      auth.on('test:event', handler1)
      auth.on('test:event', handler2)

      const listeners = auth.events.listeners('test:event')

      expect(listeners).toHaveLength(2)
      expect(listeners).toContain(handler1)
      expect(listeners).toContain(handler2)
    })
  })

  describe('Wildcard Patterns', () => {
    it('should match wildcard patterns (user:*)', async () => {
      const adapter = createMockAdapter()
      const auth = bloomAuth({ adapter })

      const handler = vi.fn()
      auth.on('user:*', handler)

      await auth.emit('user:created', { data: 'test1' })
      await auth.emit('user:updated', { data: 'test2' })
      await auth.emit('user:deleted', { data: 'test3' })

      expect(handler).toHaveBeenCalledTimes(3)
      expect(handler).toHaveBeenNthCalledWith(1, { data: 'test1' })
      expect(handler).toHaveBeenNthCalledWith(2, { data: 'test2' })
      expect(handler).toHaveBeenNthCalledWith(3, { data: 'test3' })
    })

    it('should match wildcard patterns (*:created)', async () => {
      const adapter = createMockAdapter()
      const auth = bloomAuth({ adapter })

      const handler = vi.fn()
      auth.on('*:created', handler)

      await auth.emit('user:created', { data: 'test1' })
      await auth.emit('session:created', { data: 'test2' })
      await auth.emit('post:created', { data: 'test3' })

      expect(handler).toHaveBeenCalledTimes(3)
    })

    it('should match catch-all wildcard (*)', async () => {
      const adapter = createMockAdapter()
      const auth = bloomAuth({ adapter })

      const handler = vi.fn()
      auth.on('*', handler)

      await auth.emit('anything', { data: 'test1' })
      await auth.emit('something:else', { data: 'test2' })

      expect(handler).toHaveBeenCalledTimes(2)
    })

    it('should match both exact and wildcard listeners', async () => {
      const adapter = createMockAdapter()
      const auth = bloomAuth({ adapter })

      const exactHandler = vi.fn()
      const wildcardHandler = vi.fn()

      auth.on('user:created', exactHandler)
      auth.on('user:*', wildcardHandler)

      await auth.emit('user:created', { data: 'test' })

      expect(exactHandler).toHaveBeenCalledTimes(1)
      expect(wildcardHandler).toHaveBeenCalledTimes(1)
    })
  })

  describe('Async Handlers', () => {
    it('should handle async event handlers', async () => {
      const adapter = createMockAdapter()
      const auth = bloomAuth({ adapter })

      const results: string[] = []

      auth.on('test:event', async (data) => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        results.push(`handler1: ${data.value}`)
      })

      auth.on('test:event', async (data) => {
        await new Promise((resolve) => setTimeout(resolve, 5))
        results.push(`handler2: ${data.value}`)
      })

      await auth.emit('test:event', { value: 'test' })

      expect(results).toHaveLength(2)
      expect(results).toContain('handler1: test')
      expect(results).toContain('handler2: test')
    })

    it('should not crash when event handler throws error', async () => {
      const adapter = createMockAdapter()
      const auth = bloomAuth({ adapter })

      const errorHandler = vi.fn(() => {
        throw new Error('Handler error')
      })
      const normalHandler = vi.fn()

      auth.on('test:event', errorHandler)
      auth.on('test:event', normalHandler)

      // Should not throw
      await expect(auth.emit('test:event', { data: 'test' })).resolves.toBeUndefined()

      expect(errorHandler).toHaveBeenCalledTimes(1)
      expect(normalHandler).toHaveBeenCalledTimes(1)
    })
  })

  describe('Events from Config', () => {
    it('should register events from config', async () => {
      const adapter = createMockAdapter()
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      const auth = bloomAuth({
        adapter,
        events: {
          'event1': handler1,
          'event2': handler2,
        },
      })

      await auth.emit('event1', { data: 'test1' })
      await auth.emit('event2', { data: 'test2' })

      expect(handler1).toHaveBeenCalledWith({ data: 'test1' })
      expect(handler2).toHaveBeenCalledWith({ data: 'test2' })
    })

    it('should register wildcard events from config', async () => {
      const adapter = createMockAdapter()
      const handler = vi.fn()

      const auth = bloomAuth({
        adapter,
        events: {
          'user:*': handler,
        },
      })

      await auth.emit('user:created', { data: 'test' })

      expect(handler).toHaveBeenCalledWith({ data: 'test' })
    })
  })

  describe('Session Events', () => {
    it('should emit session:loading event', async () => {
      const adapter = createMockAdapter()
      const auth = bloomAuth({ adapter })

      const handler = vi.fn()
      auth.on('session:loading', handler)

      await auth.api.getSession({
        headers: {
          cookie: 'bloom.sid={"sessionId":"sess123","userId":"user123"}',
        },
      })

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.any(Object),
        })
      )
    })

    it('should emit session:found event', async () => {
      const adapter = createMockAdapter()
      const auth = bloomAuth({ adapter })

      const handler = vi.fn()
      auth.on('session:found', handler)

      await auth.api.getSession({
        headers: {
          cookie: 'bloom.sid={"sessionId":"sess123","userId":"user123"}',
        },
      })

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ id: 'user123' }),
          session: expect.objectContaining({ id: 'sess123' }),
        })
      )
    })

    it('should emit session:accessed event', async () => {
      const adapter = createMockAdapter()
      const auth = bloomAuth({ adapter })

      const handler = vi.fn()
      auth.on('session:accessed', handler)

      await auth.api.getSession({
        headers: {
          cookie: 'bloom.sid={"sessionId":"sess123","userId":"user123"}',
        },
      })

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.any(Object),
          session: expect.any(Object),
        })
      )
    })

    it('should emit session:notfound event with reason', async () => {
      const adapter = createMockAdapter()
      const auth = bloomAuth({ adapter })

      const handler = vi.fn()
      auth.on('session:notfound', handler)

      // No cookie
      await auth.api.getSession({ headers: {} })

      expect(handler).toHaveBeenCalledWith({ reason: 'no_cookie' })
    })

    it('should emit session:* wildcard for all session events', async () => {
      const adapter = createMockAdapter()
      const auth = bloomAuth({ adapter })

      const handler = vi.fn()
      auth.on('session:*', handler)

      await auth.api.getSession({
        headers: {
          cookie: 'bloom.sid={"sessionId":"sess123","userId":"user123"}',
        },
      })

      // Should be called for: loading, found, accessed
      expect(handler).toHaveBeenCalledTimes(3)
    })
  })

  describe('Event Execution Order', () => {
    it('should execute handlers in registration order', async () => {
      const adapter = createMockAdapter()
      const auth = bloomAuth({ adapter })

      const results: number[] = []

      auth.on('test:event', async () => {
        results.push(1)
      })

      auth.on('test:event', async () => {
        results.push(2)
      })

      auth.on('test:event', async () => {
        results.push(3)
      })

      await auth.emit('test:event')

      expect(results).toEqual([1, 2, 3])
    })
  })

  describe('Multiple Emits', () => {
    it('should handle multiple sequential emits', async () => {
      const adapter = createMockAdapter()
      const auth = bloomAuth({ adapter })

      const handler = vi.fn()
      auth.on('test:event', handler)

      await auth.emit('test:event', { count: 1 })
      await auth.emit('test:event', { count: 2 })
      await auth.emit('test:event', { count: 3 })

      expect(handler).toHaveBeenCalledTimes(3)
      expect(handler).toHaveBeenNthCalledWith(1, { count: 1 })
      expect(handler).toHaveBeenNthCalledWith(2, { count: 2 })
      expect(handler).toHaveBeenNthCalledWith(3, { count: 3 })
    })
  })
})
