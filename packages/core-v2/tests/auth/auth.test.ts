import { describe, it, expect, beforeEach } from 'vitest'
import { bloomAuth } from '@/auth'
import { InMemoryStorageAdapter } from '@/storage/in-memory'
import type { User, Session } from '@/types'

const testUser: Omit<User, 'id' | 'created_at' | 'updated_at'> = {
  email: 'test@example.com',
  email_verified: true,
}

const testSession = (userId: string, sessionId: string): Omit<Session, 'createdAt' | 'lastAccessedAt'> => ({
  id: sessionId,
  userId,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  deviceType: 'unknown',
})

const createSessionCookie = (userId = 'user_123', sessionId = 'sess_abc') => {
  return encodeURIComponent(JSON.stringify({ userId, sessionId }))
}

const setupTestStorage = async (sessionId = 'sess_abc') => {
  const storage = new InMemoryStorageAdapter()

  const user = await storage.user.create({
    email: testUser.email,
    password_hash: 'test_hash',
    password_salt: 'test_salt',
    email_verified: testUser.email_verified,
  })

  await storage.session.create({
    ...testSession(user.id, sessionId),
    id: sessionId,
    userId: user.id,
  })

  return { storage, userId: user.id, sessionId }
}

describe('bloomAuth - Framework Integration', () => {
  describe('Next.js pattern', () => {
    it('should accept Web API Headers (Next.js 15+)', async () => {
      const { storage, userId, sessionId } = await setupTestStorage()
      const auth = bloomAuth({ storage })

      const headers = new Headers({
        'cookie': `bloom.sid=${createSessionCookie(userId, sessionId)}`,
        'user-agent': 'Next.js/15',
      })

      const session = await auth.api.getSession({ headers })
      expect(session).not.toBeNull()
      expect(session?.user).toBeDefined()
      expect(session?.user.id).toBe(userId)
      expect(session?.session).toBeDefined()
      expect(session?.session.id).toBe(sessionId)
    })

    it('should return null when no session cookie present', async () => {
      const { storage } = await setupTestStorage()
      const auth = bloomAuth({ storage })
      const headers = new Headers({
        'user-agent': 'Next.js/15',
      })

      const session = await auth.api.getSession({ headers })
      expect(session).toBeNull()
    })
  })

  describe('Nuxt pattern', () => {
    it('should accept plain object headers (Nuxt 4/H3)', async () => {
      const { storage, userId, sessionId } = await setupTestStorage()
      const auth = bloomAuth({ storage })

      const headers = {
        'cookie': `bloom.sid=${createSessionCookie(userId, sessionId)}`,
        'user-agent': 'Nuxt/4.0',
        'host': 'localhost:3000',
      }

      const session = await auth.api.getSession({ headers })
      expect(session).not.toBeNull()
      expect(session?.user.email).toBe('test@example.com')
      expect(session?.user.id).toBe(userId)
    })

    it('should handle H3 array header values', async () => {
      const { storage, userId, sessionId } = await setupTestStorage()
      const auth = bloomAuth({ storage })

      const headers = {
        'cookie': `bloom.sid=${createSessionCookie(userId, sessionId)}`,
        'user-agent': ['Nuxt/4.0', 'Chrome/91.0'],
      }

      const session = await auth.api.getSession({ headers })
      expect(session).not.toBeNull()
      expect(session?.user.id).toBe(userId)
    })
  })

  describe('SvelteKit pattern', () => {
    it('should accept request.headers from SvelteKit', async () => {
      const { storage, userId, sessionId } = await setupTestStorage()
      const auth = bloomAuth({ storage })

      const request = new Request('https://example.com', {
        headers: {
          'cookie': `bloom.sid=${createSessionCookie(userId, sessionId)}`,
          'user-agent': 'SvelteKit/2.0',
        },
      })

      const session = await auth.api.getSession({ headers: request.headers })
      expect(session).not.toBeNull()
      expect(session?.session.id).toBe(sessionId)
      expect(session?.user.id).toBe(userId)
    })
  })

  describe('Express pattern', () => {
    it('should accept req.headers from Express', async () => {
      const { storage, userId, sessionId } = await setupTestStorage()
      const auth = bloomAuth({ storage })

      const headers = {
        'cookie': `bloom.sid=${createSessionCookie(userId, sessionId)}`,
        'user-agent': 'Express/4.18',
        'host': 'localhost:3000',
      }

      const session = await auth.api.getSession({ headers })
      expect(session).not.toBeNull()
      expect(session?.user.email).toBe('test@example.com')
      expect(session?.user.id).toBe(userId)
    })

    it('should handle undefined header values from Express', async () => {
      const { storage, userId, sessionId } = await setupTestStorage()
      const auth = bloomAuth({ storage })

      const headers = {
        'cookie': `bloom.sid=${createSessionCookie(userId, sessionId)}`,
        'user-agent': 'Express/4.18',
        'missing': undefined,
      }

      const session = await auth.api.getSession({ headers })
      expect(session).not.toBeNull()
      expect(session?.user.id).toBe(userId)
    })
  })

  describe('Multiple cookies', () => {
    it('should extract correct cookie from multiple cookies', async () => {
      const { storage, userId, sessionId } = await setupTestStorage()
      const auth = bloomAuth({ storage })

      const headers = new Headers({
        'cookie': `theme=dark; bloom.sid=${createSessionCookie(userId, sessionId)}; lang=en`,
      })

      const session = await auth.api.getSession({ headers })
      expect(session).not.toBeNull()
      expect(session?.user.id).toBe(userId)
      expect(session?.session.id).toBe(sessionId)
    })

    it('should handle URL-encoded cookie values', async () => {
      const { storage, userId, sessionId } = await setupTestStorage('sess_xyz')
      const auth = bloomAuth({ storage })

      const sessionCookie = createSessionCookie(userId, sessionId)
      const headers = new Headers({
        'cookie': `bloom.sid=${sessionCookie}`,
      })

      const session = await auth.api.getSession({ headers })
      expect(session).not.toBeNull()
      expect(session?.user.id).toBe(userId)
      expect(session?.session.id).toBe(sessionId)
    })
  })

  describe('Missing headers', () => {
    it('should handle missing headers parameter', async () => {
      const { storage } = await setupTestStorage()
      const auth = bloomAuth({ storage })

      const session = await auth.api.getSession({})
      expect(session).toBeNull()
    })

    it('should handle empty Headers object', async () => {
      const { storage } = await setupTestStorage()
      const auth = bloomAuth({ storage })

      const headers = new Headers()
      const session = await auth.api.getSession({ headers })
      expect(session).toBeNull()
    })

    it('should handle empty plain object', async () => {
      const { storage } = await setupTestStorage()
      const auth = bloomAuth({ storage })

      const headers = {}
      const session = await auth.api.getSession({ headers })
      expect(session).toBeNull()
    })
  })

  describe('Framework-agnostic', () => {
    it('should work with all framework patterns in one test', async () => {
      const { storage, userId, sessionId } = await setupTestStorage()
      const auth = bloomAuth({ storage })

      const sessionCookie = createSessionCookie(userId, sessionId)
      const nextHeaders = new Headers({ 'cookie': `bloom.sid=${sessionCookie}` })
      const expressHeaders = { 'cookie': `bloom.sid=${sessionCookie}`, 'user-agent': 'Express/4.18' }
      const nuxtHeaders = { 'cookie': `bloom.sid=${sessionCookie}` }
      const sveltekitHeaders = new Request('https://example.com', {
        headers: { 'cookie': `bloom.sid=${sessionCookie}` },
      }).headers
      const elysiaHeaders = { 'cookie': `bloom.sid=${sessionCookie}`, 'user-agent': 'Elysia/1.4' }
      const honoHeaders = new Request('https://example.com', {
        headers: { 'cookie': `bloom.sid=${sessionCookie}` },
      }).headers
      const fastifyHeaders = { 'cookie': `bloom.sid=${sessionCookie}`, 'user-agent': 'Fastify/5.6' }
      const astroHeaders = new Request('https://example.com', {
        headers: { 'cookie': `bloom.sid=${sessionCookie}` },
      }).headers

      const nextSession = await auth.api.getSession({ headers: nextHeaders })
      const expressSession = await auth.api.getSession({ headers: expressHeaders })
      const nuxtSession = await auth.api.getSession({ headers: nuxtHeaders })
      const sveltekitSession = await auth.api.getSession({ headers: sveltekitHeaders })
      const elysiaSession = await auth.api.getSession({ headers: elysiaHeaders })
      const honoSession = await auth.api.getSession({ headers: honoHeaders })
      const fastifySession = await auth.api.getSession({ headers: fastifyHeaders })
      const astroSession = await auth.api.getSession({ headers: astroHeaders })

      expect(nextSession).not.toBeNull()
      expect(expressSession).not.toBeNull()
      expect(nuxtSession).not.toBeNull()
      expect(sveltekitSession).not.toBeNull()
      expect(elysiaSession).not.toBeNull()
      expect(honoSession).not.toBeNull()
      expect(fastifySession).not.toBeNull()
      expect(astroSession).not.toBeNull()
    })
  })
})
