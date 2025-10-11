import { describe, it, expect, beforeEach } from 'vitest'
import { bloomAuth } from '@/auth'
import { createMockAdapter } from '@/utils/mockAdapter'
import type { DatabaseAdapter } from '@/storage/adapter'

describe('Email Verification and Password Reset API Routes', () => {
  let auth: ReturnType<typeof bloomAuth>
  let adapter: DatabaseAdapter

  beforeEach(() => {
    adapter = createMockAdapter()
    auth = bloomAuth({
      adapter,
      emailPassword: {
        minPasswordLength: 8,
        maxPasswordLength: 128,
      },
    })
  })

  describe('POST /send-verification-email', () => {
    it('should send verification email for unverified user', async () => {
      const registerRequest = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
        }),
      })
      await auth.handler(registerRequest)

      const user = await adapter.user.findByEmail('test@example.com')
      await adapter.user.update(user!.id, { email_verified: false })

      const request = new Request('http://localhost/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data.success).toBe(true)
      expect(data.message).toBe('Verification email sent')

      const updatedUser = await adapter.user.findByEmail('test@example.com')
      expect(updatedUser?.email_verification_token).toBeDefined()
      expect(updatedUser?.email_verification_expires).toBeDefined()
    })

    it('should reject if user not found', async () => {
      const request = new Request('http://localhost/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
        }),
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(404)

      const data = (await response.json()) as any
      expect(data.error).toBe('User not found')
    })

    it('should reject if email already verified', async () => {
      const registerRequest = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
        }),
      })
      await auth.handler(registerRequest)

      const request = new Request('http://localhost/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(400)

      const data = (await response.json()) as any
      expect(data.error).toBe('Email already verified')
    })
  })

  describe('POST /verify-email', () => {
    it('should verify email with valid token', async () => {
      const registerRequest = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
        }),
      })
      await auth.handler(registerRequest)

      const user = await adapter.user.findByEmail('test@example.com')
      await adapter.user.update(user!.id, {
        email_verified: false,
        email_verification_token: 'test-token',
        email_verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })

      const request = new Request('http://localhost/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'test-token',
        }),
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data.success).toBe(true)
      expect(data.message).toBe('Email verified successfully')

      const updatedUser = await adapter.user.findByEmail('test@example.com')
      expect(updatedUser?.email_verified).toBe(true)
      expect(updatedUser?.email_verification_token).toBeUndefined()
      expect(updatedUser?.email_verification_expires).toBeUndefined()
    })

    it('should reject invalid token', async () => {
      const request = new Request('http://localhost/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'invalid-token',
        }),
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(400)

      const data = (await response.json()) as any
      expect(data.error).toBe('Invalid or expired verification token')
    })

    it('should reject expired token', async () => {
      const registerRequest = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
        }),
      })
      await auth.handler(registerRequest)

      const user = await adapter.user.findByEmail('test@example.com')
      await adapter.user.update(user!.id, {
        email_verified: false,
        email_verification_token: 'expired-token',
        email_verification_expires: new Date(Date.now() - 1000),
      })

      const request = new Request('http://localhost/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'expired-token',
        }),
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(400)

      const data = (await response.json()) as any
      expect(data.error).toBe('Verification token has expired')
    })
  })

  describe('POST /request-password-reset', () => {
    it('should create password reset token for existing user', async () => {
      const registerRequest = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
        }),
      })
      await auth.handler(registerRequest)

      const request = new Request('http://localhost/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data.success).toBe(true)
      expect(data.message).toBe('If the email exists, a password reset link will be sent')

      const user = await adapter.user.findByEmail('test@example.com')
      expect(user?.password_reset_token).toBeDefined()
      expect(user?.password_reset_expires).toBeDefined()
    })

    it('should return success even for nonexistent user (security)', async () => {
      const request = new Request('http://localhost/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
        }),
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data.success).toBe(true)
      expect(data.message).toBe('If the email exists, a password reset link will be sent')
    })
  })

  describe('POST /reset-password', () => {
    it('should reset password with valid token', async () => {
      const registerRequest = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'OldPassword123!',
        }),
      })
      await auth.handler(registerRequest)

      const user = await adapter.user.findByEmail('test@example.com')
      await adapter.user.update(user!.id, {
        password_reset_token: 'reset-token',
        password_reset_expires: new Date(Date.now() + 60 * 60 * 1000),
      })

      const request = new Request('http://localhost/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'reset-token',
          password: 'NewPassword123!',
        }),
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data.success).toBe(true)
      expect(data.message).toBe('Password reset successfully')

      const updatedUser = await adapter.user.findByEmail('test@example.com')
      expect(updatedUser?.password_reset_token).toBeUndefined()
      expect(updatedUser?.password_reset_expires).toBeUndefined()

      const loginRequest = new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'NewPassword123!',
        }),
      })

      const loginResponse = await auth.handler(loginRequest)
      expect(loginResponse.status).toBe(200)
    })

    it('should reject invalid token', async () => {
      const request = new Request('http://localhost/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'invalid-token',
          password: 'NewPassword123!',
        }),
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(400)

      const data = (await response.json()) as any
      expect(data.error).toBe('Invalid or expired reset token')
    })

    it('should reject expired token', async () => {
      const registerRequest = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'OldPassword123!',
        }),
      })
      await auth.handler(registerRequest)

      const user = await adapter.user.findByEmail('test@example.com')
      await adapter.user.update(user!.id, {
        password_reset_token: 'expired-token',
        password_reset_expires: new Date(Date.now() - 1000),
      })

      const request = new Request('http://localhost/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'expired-token',
          password: 'NewPassword123!',
        }),
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(400)

      const data = (await response.json()) as any
      expect(data.error).toBe('Reset token has expired')
    })

    it('should validate password length', async () => {
      const registerRequest = new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'OldPassword123!',
        }),
      })
      await auth.handler(registerRequest)

      const user = await adapter.user.findByEmail('test@example.com')
      await adapter.user.update(user!.id, {
        password_reset_token: 'reset-token',
        password_reset_expires: new Date(Date.now() + 60 * 60 * 1000),
      })

      const request = new Request('http://localhost/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'reset-token',
          password: 'short',
        }),
      })

      const response = await auth.handler(request)
      expect(response.status).toBe(400)

      const data = (await response.json()) as any
      expect(data.error).toBe('Invalid password')
    })
  })
})
