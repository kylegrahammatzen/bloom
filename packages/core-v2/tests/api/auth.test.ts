import { describe, it, expect, beforeEach, vi } from 'vitest'
import { bloomAuth } from '@/auth'
import type { DatabaseAdapter } from '@/storage/adapter'
import type { User, Session } from '@/types'

function createMockAdapter(): DatabaseAdapter {
  const users: Map<string, User & { password_hash: string; password_salt: string }> = new Map()
  const sessions: Map<string, Session> = new Map()

  return {
    user: {
      async findById(id: string) {
        const user = Array.from(users.values()).find((u) => u.id === id)
        return user ? { ...user } : null
      },
      async findByEmail(email: string) {
        const user = Array.from(users.values()).find((u) => u.email === email.toLowerCase())
        return user ? { ...user } : null
      },
      async create(data) {
        const id = `user_${Date.now()}`
        const user = {
          id,
          email: data.email,
          email_verified: data.email_verified ?? false,
          name: data.name,
          image: undefined,
          created_at: new Date(),
          updated_at: new Date(),
          last_login: undefined,
          password_hash: data.password_hash,
          password_salt: data.password_salt,
        }
        users.set(id, user)
        return user
      },
      async update(id: string, data) {
        const user = users.get(id)
        if (!user) return null

        const updated = {
          ...user,
          ...data,
          updated_at: new Date(),
        }
        users.set(id, updated)
        return updated
      },
      async delete(id: string) {
        return users.delete(id)
      },
    },
    session: {
      async findById(id: string) {
        const session = sessions.get(id)
        if (!session || session.expiresAt < new Date()) {
          return null
        }
        return session
      },
      async findByUserId(userId: string) {
        return Array.from(sessions.values()).filter(
          (s) => s.userId === userId && s.expiresAt > new Date()
        )
      },
      async create(data) {
        const session: Session = {
          id: data.id,
          userId: data.userId,
          expiresAt: data.expiresAt,
          createdAt: new Date(),
          lastAccessedAt: new Date(),
        }
        sessions.set(data.id, session)
        return session
      },
      async updateLastAccessed(id: string) {
        const session = sessions.get(id)
        if (!session) return null

        session.lastAccessedAt = new Date()
        sessions.set(id, session)
        return session
      },
      async delete(id: string) {
        return sessions.delete(id)
      },
      async deleteByUserId(userId: string) {
        const userSessions = Array.from(sessions.entries()).filter(([_, s]) => s.userId === userId)
        userSessions.forEach(([id]) => sessions.delete(id))
        return userSessions.length
      },
      async deleteExpired() {
        const now = new Date()
        const expired = Array.from(sessions.entries()).filter(([_, s]) => s.expiresAt < now)
        expired.forEach(([id]) => sessions.delete(id))
        return expired.length
      },
    },
  }
}

describe('Auth API Routes', () => {
  let auth: ReturnType<typeof bloomAuth>
  let adapter: DatabaseAdapter

  beforeEach(() => {
    adapter = createMockAdapter()
    auth = bloomAuth({
      adapter,
      emailPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
      },
      session: {
        expiresIn: 7 * 24 * 60 * 60,
      },
    })
  })

  describe('POST /register', () => {
    it('should create user and return session', async () => {
      const request = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        }),
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(201)

      const data = (await response.json()) as any
      expect(data).toHaveProperty('user')
      expect(data).toHaveProperty('session')
      expect(data.user.email).toBe('test@example.com')
      expect(data.user.name).toBe('Test User')

      const setCookie = response.headers.get('Set-Cookie')
      expect(setCookie).toContain('bloom.sid=')
    })

    it('should reject duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
      }

      const request1 = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      await auth.handler(request1)

      const request2 = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      const response = await auth.handler(request2)
      expect(response.status).toBe(409)

      const data = (await response.json()) as any
      expect(data.error).toBe('User already exists')
    })

    it('should validate password length', async () => {
      const request = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'short',
        }),
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(400)

      const data = (await response.json()) as any
      expect(data.error).toBe('Invalid password')
    })

    it('should validate email format', async () => {
      const request = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
          password: 'Password123!',
        }),
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(400)

      const data = (await response.json()) as any
      expect(data.error).toBe('Invalid request')
    })
  })

  describe('POST /login', () => {
    beforeEach(async () => {
      const request = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
        }),
      })
      await auth.handler(request)
    })

    it('should login with correct credentials', async () => {
      const request = new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
        }),
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data).toHaveProperty('user')
      expect(data).toHaveProperty('session')
      expect(data.user.email).toBe('test@example.com')

      const setCookie = response.headers.get('Set-Cookie')
      expect(setCookie).toContain('bloom.sid=')
    })

    it('should reject incorrect password', async () => {
      const request = new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'WrongPassword!',
        }),
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(401)

      const data = (await response.json()) as any
      expect(data.error).toBe('Invalid email or password')
    })

    it('should reject non-existent user', async () => {
      const request = new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        }),
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(401)

      const data = (await response.json()) as any
      expect(data.error).toBe('Invalid email or password')
    })
  })

  describe('POST /logout', () => {
    let sessionCookie: string

    beforeEach(async () => {
      const registerRequest = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
        }),
      })

      const registerResponse = await auth.handler(registerRequest)
      const cookie = registerResponse.headers.get('Set-Cookie')
      sessionCookie = cookie?.split(';')[0] || ''
    })

    it('should logout and clear session', async () => {
      const request = new Request('http://localhost/auth/logout', {
        method: 'POST',
        headers: {
          'Cookie': sessionCookie,
        },
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data.success).toBe(true)

      const clearCookie = response.headers.get('Set-Cookie')
      expect(clearCookie).toContain('Max-Age=0')
    })

    it('should reject logout without session', async () => {
      const request = new Request('http://localhost/auth/logout', {
        method: 'POST',
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(401)

      const data = (await response.json()) as any
      expect(data.error).toBe('No active session')
    })
  })

  describe('Integration Flow', () => {
    it('should complete full auth flow', async () => {
      const registerRequest = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'flow@example.com',
          password: 'FlowPassword123!',
        }),
      })

      const registerResponse = await auth.handler(registerRequest)
      expect(registerResponse.status).toBe(201)
      const registerCookie = registerResponse.headers.get('Set-Cookie')?.split(';')[0] || ''

      const sessionRequest = new Request('http://localhost/auth/session', {
        method: 'GET',
        headers: {
          'Cookie': registerCookie,
        },
      })

      const sessionResponse = await auth.handler(sessionRequest)
      expect(sessionResponse.status).toBe(200)
      const sessionData = (await sessionResponse.json()) as any
      expect(sessionData.user.email).toBe('flow@example.com')

      const logoutRequest = new Request('http://localhost/auth/logout', {
        method: 'POST',
        headers: {
          'Cookie': registerCookie,
        },
      })

      const logoutResponse = await auth.handler(logoutRequest)
      expect(logoutResponse.status).toBe(200)

      const sessionAfterLogout = new Request('http://localhost/auth/session', {
        method: 'GET',
        headers: {
          'Cookie': registerCookie,
        },
      })

      const sessionAfterLogoutResponse = await auth.handler(sessionAfterLogout)
      const sessionAfterLogoutData = (await sessionAfterLogoutResponse.json()) as any
      expect(sessionAfterLogoutData).toBeNull()
    })
  })
})
