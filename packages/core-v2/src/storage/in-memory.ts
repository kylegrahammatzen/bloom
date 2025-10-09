import type { StorageAdapter } from './adapter'
import type { User, Session, CreateUserData, UpdateUserData, CreateSessionData } from '@/schemas'
import { CreateUserDataSchema, UpdateUserDataSchema, CreateSessionDataSchema } from '@/schemas'
import { normalizeEmail } from '@/utils/crypto'

export class InMemoryStorageAdapter implements StorageAdapter {
  private users = new Map<string, User>()
  private sessions = new Map<string, Session>()
  private emailIndex = new Map<string, string>()

  user = {
    findById: async (id: string): Promise<User | null> => {
      return this.users.get(id) ?? null
    },

    findByEmail: async (email: string): Promise<User | null> => {
      const normalized = normalizeEmail(email)
      const userId = this.emailIndex.get(normalized)
      if (!userId) return null
      return this.users.get(userId) ?? null
    },

    create: async (data: CreateUserData): Promise<User> => {
      const normalized = normalizeEmail(data.email)
      const validated = CreateUserDataSchema.parse({ ...data, email: normalized })
      const id = `user_${Date.now()}_${Math.random().toString(36).slice(2)}`

      if (this.emailIndex.has(normalized)) {
        throw new Error('Email already exists')
      }

      const user: User = {
        id,
        email: normalized,
        email_verified: validated.email_verified ?? false,
        created_at: new Date(),
        updated_at: new Date(),
      }

      this.users.set(id, user)
      this.emailIndex.set(normalized, id)

      return user
    },

    update: async (id: string, data: UpdateUserData): Promise<User | null> => {
      const normalizedData = data.email ? { ...data, email: normalizeEmail(data.email) } : data
      const validated = UpdateUserDataSchema.parse(normalizedData)
      const user = this.users.get(id)
      if (!user) return null

      if (validated.email && validated.email !== user.email) {
        const normalized = validated.email

        if (this.emailIndex.has(normalized)) {
          throw new Error('Email already exists')
        }

        this.emailIndex.delete(user.email)
        this.emailIndex.set(normalized, id)
        user.email = normalized
      }

      if (validated.email_verified !== undefined) {
        user.email_verified = validated.email_verified
      }

      user.updated_at = new Date()
      this.users.set(id, user)

      return user
    },

    delete: async (id: string): Promise<boolean> => {
      const user = this.users.get(id)
      if (!user) return false

      this.emailIndex.delete(user.email)
      this.users.delete(id)
      await this.session.deleteByUserId(id)

      return true
    },
  }

  session = {
    findById: async (id: string): Promise<Session | null> => {
      const session = this.sessions.get(id)
      if (!session) return null

      if (session.expiresAt < new Date()) {
        this.sessions.delete(id)
        return null
      }

      return session
    },

    findByUserId: async (userId: string): Promise<Session[]> => {
      const now = new Date()
      const sessions: Session[] = []

      for (const session of this.sessions.values()) {
        if (session.userId === userId && session.expiresAt >= now) {
          sessions.push(session)
        }
      }

      return sessions
    },

    create: async (data: CreateSessionData): Promise<Session> => {
      const validated = CreateSessionDataSchema.parse(data)
      const user = await this.user.findById(validated.userId)
      if (!user) {
        throw new Error('User not found')
      }

      const session: Session = {
        id: validated.id,
        userId: validated.userId,
        expiresAt: validated.expiresAt,
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        deviceType: validated.deviceType ?? 'unknown',
        ipAddress: validated.ipAddress,
        userAgent: validated.userAgent,
      }

      this.sessions.set(session.id, session)
      return session
    },

    updateLastAccessed: async (id: string): Promise<Session | null> => {
      const session = this.sessions.get(id)
      if (!session) return null

      if (session.expiresAt < new Date()) {
        this.sessions.delete(id)
        return null
      }

      session.lastAccessedAt = new Date()
      this.sessions.set(id, session)

      return session
    },

    delete: async (id: string): Promise<boolean> => {
      return this.sessions.delete(id)
    },

    deleteByUserId: async (userId: string): Promise<number> => {
      let count = 0

      for (const [id, session] of this.sessions.entries()) {
        if (session.userId === userId) {
          this.sessions.delete(id)
          count++
        }
      }

      return count
    },

    deleteExpired: async (): Promise<number> => {
      const now = new Date()
      let count = 0

      for (const [id, session] of this.sessions.entries()) {
        if (session.expiresAt < now) {
          this.sessions.delete(id)
          count++
        }
      }

      return count
    },
  }

  clear(): void {
    this.users.clear()
    this.sessions.clear()
    this.emailIndex.clear()
  }

  _getState() {
    return {
      users: Array.from(this.users.values()),
      sessions: Array.from(this.sessions.values()),
      emailIndex: Array.from(this.emailIndex.entries()),
    }
  }
}
