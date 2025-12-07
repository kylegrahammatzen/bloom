import type { DatabaseAdapter } from '@/storage/adapter'
import type { User, Session } from '@/types'

/**
 * Create an in-memory mock database adapter for testing
 *
 * Uses Map-based storage that persists within a single test.
 * Automatically generates unique IDs for users and sessions.
 * Perfect for unit tests without requiring a real database.
 *
 * @returns Mock adapter implementing the full DatabaseAdapter interface
 *
 * @example
 * ```ts
 * const adapter = createMockAdapter()
 *
 * const user = await adapter.user.create({
 *   email: 'test@example.com',
 *   password_hash: 'hash',
 *   password_salt: 'salt',
 *   email_verified: true
 * })
 *
 * const session = await adapter.session.create({
 *   id: 'sess_123',
 *   userId: user.id,
 *   expiresAt: new Date(Date.now() + 1000 * 60 * 60)
 * })
 * ```
 */
export function createMockAdapter(): DatabaseAdapter {
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
      async findByEmailVerificationToken(token: string) {
        const user = Array.from(users.values()).find(
          (u) => u.email_verification_token === token
        )
        return user ? { ...user } : null
      },
      async findByPasswordResetToken(token: string) {
        const user = Array.from(users.values()).find((u) => u.password_reset_token === token)
        return user ? { ...user } : null
      },
      async create(data) {
        const id = `user_${Date.now()}_${Math.random()}`
        const user = {
          id,
          email: data.email,
          email_verified: data.email_verified ?? false,
          name: data.name,
          image: undefined,
          created_at: new Date(),
          updated_at: new Date(),
          last_login: undefined,
          email_verification_token: undefined,
          email_verification_expires: undefined,
          password_reset_token: undefined,
          password_reset_expires: undefined,
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
