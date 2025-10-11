import type { DatabaseAdapter } from '@/storage/adapter'
import type { User, Session } from '@/types'
import type { CreateUserData, UpdateUserData, CreateSessionData } from '@/schemas'
import { generateSessionId } from '@/utils/crypto'

export type PrismaClient = {
  user: {
    findUnique: (args: any) => Promise<any>
    findFirst: (args: any) => Promise<any>
    create: (args: any) => Promise<any>
    update: (args: any) => Promise<any>
    delete: (args: any) => Promise<any>
  }
  session: {
    findUnique: (args: any) => Promise<any>
    findMany: (args: any) => Promise<any[]>
    create: (args: any) => Promise<any>
    update: (args: any) => Promise<any>
    delete: (args: any) => Promise<any>
    deleteMany: (args: any) => Promise<any>
  }
}

/**
 * Prisma ORM adapter for Bloom Core v2
 *
 * @example
 * ```ts
 * import { PrismaClient } from '@prisma/client'
 * import { prismaAdapter } from '@bloom/core-v2/adapters/prisma'
 * import { bloomAuth } from '@bloom/core-v2'
 *
 * const prisma = new PrismaClient()
 *
 * const auth = bloomAuth({
 *   adapter: prismaAdapter(prisma),
 * })
 * ```
 */
export function prismaAdapter(prisma: PrismaClient): DatabaseAdapter {
  return {
    user: {
      async findById(id: string): Promise<User | null> {
        const user = await prisma.user.findUnique({
          where: { id },
        })

        if (!user) return null

        return {
          id: user.id,
          email: user.email,
          email_verified: user.email_verified,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login: user.last_login ?? undefined,
        }
      },

      async findByEmail(email: string): Promise<User | null> {
        const normalizedEmail = email.toLowerCase()
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        })

        if (!user) return null

        return {
          id: user.id,
          email: user.email,
          email_verified: user.email_verified,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login: user.last_login ?? undefined,
        }
      },

      async findByEmailVerificationToken(token: string): Promise<User | null> {
        const user = await prisma.user.findFirst({
          where: {
            email_verification_token: token,
            email_verification_expires: {
              gt: new Date(),
            },
          },
        })

        if (!user) return null

        return {
          id: user.id,
          email: user.email,
          email_verified: user.email_verified,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login: user.last_login ?? undefined,
        }
      },

      async findByPasswordResetToken(token: string): Promise<User | null> {
        const user = await prisma.user.findFirst({
          where: {
            password_reset_token: token,
            password_reset_expires: {
              gt: new Date(),
            },
          },
        })

        if (!user) return null

        return {
          id: user.id,
          email: user.email,
          email_verified: user.email_verified,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login: user.last_login ?? undefined,
        }
      },

      async create(data: CreateUserData): Promise<User> {
        const id = generateSessionId()
        const now = new Date()

        const user = await prisma.user.create({
          data: {
            id,
            email: data.email.toLowerCase(),
            password_hash: data.password_hash,
            password_salt: data.password_salt,
            email_verified: data.email_verified ?? false,
            created_at: now,
            updated_at: now,
          },
        })

        return {
          id: user.id,
          email: user.email,
          email_verified: user.email_verified,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login: user.last_login ?? undefined,
        }
      },

      async update(id: string, data: UpdateUserData): Promise<User | null> {
        const updates: any = {
          updated_at: new Date(),
        }

        if (data.email !== undefined) {
          updates.email = data.email.toLowerCase()
        }
        if (data.password_hash !== undefined) {
          updates.password_hash = data.password_hash
        }
        if (data.password_salt !== undefined) {
          updates.password_salt = data.password_salt
        }
        if (data.email_verified !== undefined) {
          updates.email_verified = data.email_verified
        }

        const user = await prisma.user.update({
          where: { id },
          data: updates,
        })

        return {
          id: user.id,
          email: user.email,
          email_verified: user.email_verified,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login: user.last_login ?? undefined,
        }
      },

      async delete(id: string): Promise<boolean> {
        try {
          await prisma.user.delete({
            where: { id },
          })
          return true
        } catch {
          return false
        }
      },
    },

    session: {
      async findById(id: string): Promise<Session | null> {
        const session = await prisma.session.findUnique({
          where: {
            id,
            expires_at: {
              gt: new Date(),
            },
          },
        })

        if (!session) return null

        return {
          id: session.id,
          userId: session.user_id,
          expiresAt: session.expires_at,
          createdAt: session.created_at,
          lastAccessedAt: session.last_accessed_at,
        }
      },

      async findByUserId(userId: string): Promise<Session[]> {
        const sessions = await prisma.session.findMany({
          where: {
            user_id: userId,
            expires_at: {
              gt: new Date(),
            },
          },
        })

        return sessions.map((session) => ({
          id: session.id,
          userId: session.user_id,
          expiresAt: session.expires_at,
          createdAt: session.created_at,
          lastAccessedAt: session.last_accessed_at,
        }))
      },

      async create(data: CreateSessionData): Promise<Session> {
        const now = new Date()

        const session = await prisma.session.create({
          data: {
            id: data.id,
            user_id: data.userId,
            expires_at: data.expiresAt,
            created_at: now,
            last_accessed_at: now,
          },
        })

        return {
          id: session.id,
          userId: session.user_id,
          expiresAt: session.expires_at,
          createdAt: session.created_at,
          lastAccessedAt: session.last_accessed_at,
        }
      },

      async updateLastAccessed(id: string): Promise<Session | null> {
        const session = await prisma.session.update({
          where: { id },
          data: {
            last_accessed_at: new Date(),
          },
        })

        return {
          id: session.id,
          userId: session.user_id,
          expiresAt: session.expires_at,
          createdAt: session.created_at,
          lastAccessedAt: session.last_accessed_at,
        }
      },

      async delete(id: string): Promise<boolean> {
        try {
          await prisma.session.delete({
            where: { id },
          })
          return true
        } catch {
          return false
        }
      },

      async deleteByUserId(userId: string): Promise<number> {
        const result = await prisma.session.deleteMany({
          where: { user_id: userId },
        })

        return result.count
      },

      async deleteExpired(): Promise<number> {
        const result = await prisma.session.deleteMany({
          where: {
            expires_at: {
              lt: new Date(),
            },
          },
        })

        return result.count
      },
    },
  }
}
