import type { DatabaseAdapter } from '@/storage/adapter'
import type { User, Session } from '@/types'
import type { CreateUserData, UpdateUserData, CreateSessionData } from '@/schemas'
import { generateSessionId } from '@/utils/crypto'

export type KyselyDatabase = {
  selectFrom: (table: string) => any
  insertInto: (table: string) => any
  updateTable: (table: string) => any
  deleteFrom: (table: string) => any
}

export type KyselyAdapterOptions = {
  tables?: {
    users?: string
    sessions?: string
  }
}

/**
 * Kysely query builder adapter for Bloom Core v2
 *
 * @example SQLite
 * ```ts
 * import { Kysely } from 'kysely'
 * import { SqliteDialect } from 'kysely'
 * import Database from 'better-sqlite3'
 * import { kyselyAdapter } from '@bloom/core-v2/adapters/kysely'
 *
 * const db = new Kysely({
 *   dialect: new SqliteDialect({
 *     database: new Database('auth.db')
 *   })
 * })
 *
 * const auth = bloomAuth({
 *   adapter: kyselyAdapter(db),
 * })
 * ```
 */
export function kyselyAdapter(
  db: KyselyDatabase,
  options: KyselyAdapterOptions = {}
): DatabaseAdapter {
  const tables = {
    users: options.tables?.users ?? 'users',
    sessions: options.tables?.sessions ?? 'sessions',
  }

  return {
    user: {
      async findById(id: string): Promise<User | null> {
        const result = await db
          .selectFrom(tables.users)
          .selectAll()
          .where('id', '=', id)
          .executeTakeFirst()

        if (!result) return null

        return {
          id: result.id,
          email: result.email,
          email_verified: result.email_verified,
          name: result.name ?? undefined,
          image: result.image ?? undefined,
          created_at: result.created_at,
          updated_at: result.updated_at,
          last_login: result.last_login ?? undefined,
        }
      },

      async findByEmail(email: string): Promise<User | null> {
        const normalizedEmail = email.toLowerCase()
        const result = await db
          .selectFrom(tables.users)
          .selectAll()
          .where('email', '=', normalizedEmail)
          .executeTakeFirst()

        if (!result) return null

        return {
          id: result.id,
          email: result.email,
          email_verified: result.email_verified,
          name: result.name ?? undefined,
          image: result.image ?? undefined,
          created_at: result.created_at,
          updated_at: result.updated_at,
          last_login: result.last_login ?? undefined,
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

        await db
          .insertInto(tables.users)
          .values(dbUser)
          .execute()

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
          .updateTable(tables.users)
          .set(updates)
          .where('id', '=', id)
          .execute()

        return this.findById(id)
      },

      async delete(id: string): Promise<boolean> {
        const result = await db
          .deleteFrom(tables.users)
          .where('id', '=', id)
          .executeTakeFirst()

        return Number(result.numDeletedRows) > 0
      },
    },

    session: {
      async findById(id: string): Promise<Session | null> {
        const result = await db
          .selectFrom(tables.sessions)
          .selectAll()
          .where('id', '=', id)
          .where('expires_at', '>', new Date())
          .executeTakeFirst()

        if (!result) return null

        return {
          id: result.id,
          userId: result.user_id,
          expiresAt: result.expires_at,
          createdAt: result.created_at,
          lastAccessedAt: result.last_accessed_at,
        }
      },

      async findByUserId(userId: string): Promise<Session[]> {
        const result = await db
          .selectFrom(tables.sessions)
          .selectAll()
          .where('user_id', '=', userId)
          .where('expires_at', '>', new Date())
          .execute()

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

        await db
          .insertInto(tables.sessions)
          .values(dbSession)
          .execute()

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
          .updateTable(tables.sessions)
          .set({ last_accessed_at: new Date() })
          .where('id', '=', id)
          .execute()

        return this.findById(id)
      },

      async delete(id: string): Promise<boolean> {
        const result = await db
          .deleteFrom(tables.sessions)
          .where('id', '=', id)
          .executeTakeFirst()

        return Number(result.numDeletedRows) > 0
      },

      async deleteByUserId(userId: string): Promise<number> {
        const result = await db
          .deleteFrom(tables.sessions)
          .where('user_id', '=', userId)
          .executeTakeFirst()

        return Number(result.numDeletedRows)
      },

      async deleteExpired(): Promise<number> {
        const result = await db
          .deleteFrom(tables.sessions)
          .where('expires_at', '<', new Date())
          .executeTakeFirst()

        return Number(result.numDeletedRows)
      },
    },
  }
}
