import { describe, it, expect, beforeEach } from 'vitest'
import { bloomAuth } from '@/auth'
import { createMockAdapter } from '@/utils/mockAdapter'
import type { DatabaseAdapter } from '@/storage/adapter'

describe('Session Management API Routes', () => {
  let auth: ReturnType<typeof bloomAuth>
  let adapter: DatabaseAdapter

  beforeEach(() => {
    adapter = createMockAdapter()
    auth = bloomAuth({
      adapter,
      emailPassword: {},
    })
  })

  describe('GET /sessions', () => {
    it('should list all sessions for authenticated user', async () => {
      const registerRequest = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
        }),
      })

      const registerResponse = await auth.handler(registerRequest)
      const cookie = registerResponse.headers.get('Set-Cookie')?.split(';')[0] || ''

      const request = new Request('http://localhost/auth/sessions', {
        method: 'GET',
        headers: {
          'Cookie': cookie,
        },
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data).toHaveProperty('sessions')
      expect(Array.isArray(data.sessions)).toBe(true)
      expect(data.sessions.length).toBe(1)
      expect(data.sessions[0]).toHaveProperty('id')
      expect(data.sessions[0]).toHaveProperty('userId')
      expect(data.sessions[0]).toHaveProperty('expiresAt')
    })

    it('should reject request without session', async () => {
      const request = new Request('http://localhost/auth/sessions', {
        method: 'GET',
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(401)

      const data = (await response.json()) as any
      expect(data.error).toBe('No active session')
    })
  })

  describe('DELETE /sessions/:id', () => {
    it('should revoke specific session', async () => {
      const registerRequest = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
        }),
      })

      const registerResponse = await auth.handler(registerRequest)
      const cookie = registerResponse.headers.get('Set-Cookie')?.split(';')[0] || ''

      await new Promise((resolve) => setTimeout(resolve, 10))

      const loginRequest = new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
        }),
      })

      const loginResponse = await auth.handler(loginRequest)
      const loginCookie = loginResponse.headers.get('Set-Cookie')?.split(';')[0] || ''

      const sessionsRequest = new Request('http://localhost/auth/sessions', {
        method: 'GET',
        headers: { 'Cookie': cookie },
      })

      const sessionsResponse = await auth.handler(sessionsRequest)
      const sessionsData = (await sessionsResponse.json()) as any
      expect(sessionsData.sessions.length).toBe(2)

      const registerSessionId = sessionsData.sessions.find(
        (s: any) => cookie.includes(s.id)
      )?.id
      const loginSessionId = sessionsData.sessions.find(
        (s: any) => loginCookie.includes(s.id)
      )?.id
      const sessionIdToDelete = loginSessionId

      const deleteRequest = new Request(
        `http://localhost/auth/sessions/${sessionIdToDelete}`,
        {
          method: 'DELETE',
          headers: { 'Cookie': cookie },
        }
      )

      const deleteResponse = await auth.handler(deleteRequest)
      expect(deleteResponse.status).toBe(200)

      const deleteData = (await deleteResponse.json()) as any
      expect(deleteData.success).toBe(true)

      const sessionsAfterRequest = new Request('http://localhost/auth/sessions', {
        method: 'GET',
        headers: { 'Cookie': cookie },
      })

      const sessionsAfterResponse = await auth.handler(sessionsAfterRequest)
      const sessionsAfterData = (await sessionsAfterResponse.json()) as any
      expect(sessionsAfterData.sessions.length).toBe(1)
    })

    it('should reject revoke without session', async () => {
      const request = new Request('http://localhost/auth/sessions/session_123', {
        method: 'DELETE',
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(401)

      const data = (await response.json()) as any
      expect(data.error).toBe('No active session')
    })

    it('should reject revoke of non-existent session', async () => {
      const registerRequest = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
        }),
      })

      const registerResponse = await auth.handler(registerRequest)
      const cookie = registerResponse.headers.get('Set-Cookie')?.split(';')[0] || ''

      const request = new Request('http://localhost/auth/sessions/nonexistent_session', {
        method: 'DELETE',
        headers: { 'Cookie': cookie },
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(404)

      const data = (await response.json()) as any
      expect(data.error).toBe('Session not found')
    })
  })

  describe('DELETE /sessions', () => {
    it('should revoke all sessions except current', async () => {
      const registerRequest = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
        }),
      })

      const registerResponse = await auth.handler(registerRequest)
      const cookie = registerResponse.headers.get('Set-Cookie')?.split(';')[0] || ''

      await new Promise((resolve) => setTimeout(resolve, 10))

      const loginRequest1 = new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
        }),
      })
      await auth.handler(loginRequest1)

      await new Promise((resolve) => setTimeout(resolve, 10))

      const loginRequest2 = new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
        }),
      })
      await auth.handler(loginRequest2)

      const sessionsRequest = new Request('http://localhost/auth/sessions', {
        method: 'GET',
        headers: { 'Cookie': cookie },
      })

      const sessionsResponse = await auth.handler(sessionsRequest)
      const sessionsData = (await sessionsResponse.json()) as any
      expect(sessionsData.sessions.length).toBe(3)

      const deleteRequest = new Request('http://localhost/auth/sessions', {
        method: 'DELETE',
        headers: { 'Cookie': cookie },
      })

      const deleteResponse = await auth.handler(deleteRequest)
      expect(deleteResponse.status).toBe(200)

      const deleteData = (await deleteResponse.json()) as any
      expect(deleteData.success).toBe(true)
      expect(deleteData.count).toBe(2)

      const sessionsAfterRequest = new Request('http://localhost/auth/sessions', {
        method: 'GET',
        headers: { 'Cookie': cookie },
      })

      const sessionsAfterResponse = await auth.handler(sessionsAfterRequest)
      const sessionsAfterData = (await sessionsAfterResponse.json()) as any
      expect(sessionsAfterData.sessions.length).toBe(1)
    })

    it('should reject revoke all without session', async () => {
      const request = new Request('http://localhost/auth/sessions', {
        method: 'DELETE',
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(401)

      const data = (await response.json()) as any
      expect(data.error).toBe('No active session')
    })
  })
})
