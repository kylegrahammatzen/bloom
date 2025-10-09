import type { DatabaseAdapter } from '@/storage/adapter'
import type { User, Session } from '@/types'
import type { CreateUserData, UpdateUserData, CreateSessionData } from '@/schemas'
import { eq, and, gt, lt } from 'drizzle-orm'
import { generateSessionId } from '@/utils/crypto'

export type DrizzleDatabase = {
  select: () => any
  insert: (table: any) => any
  update: (table: any) => any
  delete: (table: any) => any
}

export type DrizzleTable = {
  [key: string]: any
}

export type DrizzleAdapterOptions = {
  schema: {
    users: DrizzleTable
    sessions: DrizzleTable
  }
}

/**
 * Drizzle ORM adapter for Bloom Core v2
 *
 * @example SQLite
 * ```ts
 * import { drizzle } from 'drizzle-orm/better-sqlite3'
 * import Database from 'better-sqlite3'
 * import { drizzleAdapter } from '@bloom/core-v2/adapters/drizzle'
 * import { users, sessions } from './schema'
 *
 * const sqlite = new Database('auth.db')
 * const db = drizzle(sqlite)
 *
 * const auth = bloomAuth({
 *   adapter: drizzleAdapter(db, { schema: { users, sessions } }),
 * })
 * ```
 */
export function drizzleAdapter(
  db: DrizzleDatabase,
  options: DrizzleAdapterOptions
): DatabaseAdapter {
  const { users, sessions } = options.schema

  return {
    user: {
      async findById(id: string): Promise<User | null> {
        const result = await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1)

        if (!result[0]) return null

        const row = result[0]
        return {
          id: row.id,
          email: row.email,
          email_verified: row.email_verified,
          name: row.name ?? undefined,
          image: row.image ?? undefined,
          created_at: row.created_at,
          updated_at: row.updated_at,
          last_login: row.last_login ?? undefined,
        }
      },

      async findByEmail(email: string): Promise<User | null> {
        const normalizedEmail = email.toLowerCase()
        const result = await db
          .select()
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1)

        if (!result[0]) return null

        const row = result[0]
        return {
          id: row.id,
          email: row.email,
          email_verified: row.email_verified,
          name: row.name ?? undefined,
          image: row.image ?? undefined,
          created_at: row.created_at,
          updated_at: row.updated_at,
          last_login: row.last_login ?? undefined,
        }
      },

      async create(data: CreateUserData): Promise<User> {
        const id = generateSessionId()
        const now = new Date()

        const dbUser = {
          id,
          email: data.email.toLowerCase(),
          password_hash: data.password_hash,
          password_salt: data.password_salt,
          email_verified: data.email_verified ?? false,
          name: null,
          image: null,
          created_at: now,
          updated_at: now,
          last_login: null,
        }

        await db.insert(users).values(dbUser)

        return {
          id: dbUser.id,
          email: dbUser.email,
          email_verified: dbUser.email_verified,
          name: undefined,
          image: undefined,
          created_at: dbUser.created_at,
          updated_at: dbUser.updated_at,
          last_login: undefined,
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

        await db
          .update(users)
          .set(updates)
          .where(eq(users.id, id))

        return this.findById(id)
      },

      async delete(id: string): Promise<boolean> {
        const result = await db
          .delete(users)
          .where(eq(users.id, id))

        return result.rowsAffected > 0
      },
    },

    session: {
      async findById(id: string): Promise<Session | null> {
        const result = await db
          .select()
          .from(sessions)
          .where(
            and(
              eq(sessions.id, id),
              gt(sessions.expires_at, new Date())
            )
          )
          .limit(1)

        if (!result[0]) return null

        const row = result[0]
        return {
          id: row.id,
          userId: row.user_id,
          expiresAt: row.expires_at,
          createdAt: row.created_at,
          lastAccessedAt: row.last_accessed_at,
        }
      },

      async findByUserId(userId: string): Promise<Session[]> {
        const result = await db
          .select()
          .from(sessions)
          .where(
            and(
              eq(sessions.user_id, userId),
              gt(sessions.expires_at, new Date())
            )
          )

        return result.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          expiresAt: row.expires_at,
          createdAt: row.created_at,
          lastAccessedAt: row.last_accessed_at,
        }))
      },

      async create(data: CreateSessionData): Promise<Session> {
        const now = new Date()

        const dbSession = {
          id: data.id,
          user_id: data.userId,
          expires_at: data.expiresAt,
          created_at: now,
          last_accessed_at: now,
        }

        await db.insert(sessions).values(dbSession)

        return {
          id: dbSession.id,
          userId: dbSession.user_id,
          expiresAt: dbSession.expires_at,
          createdAt: dbSession.created_at,
          lastAccessedAt: dbSession.last_accessed_at,
        }
      },

      async updateLastAccessed(id: string): Promise<Session | null> {
        await db
          .update(sessions)
          .set({ last_accessed_at: new Date() })
          .where(eq(sessions.id, id))

        return this.findById(id)
      },

      async delete(id: string): Promise<boolean> {
        const result = await db
          .delete(sessions)
          .where(eq(sessions.id, id))

        return result.rowsAffected > 0
      },

      async deleteByUserId(userId: string): Promise<number> {
        const result = await db
          .delete(sessions)
          .where(eq(sessions.user_id, userId))

        return result.rowsAffected
      },

      async deleteExpired(): Promise<number> {
        const result = await db
          .delete(sessions)
          .where(lt(sessions.expires_at, new Date()))

        return result.rowsAffected
      },
    },
  }
}
