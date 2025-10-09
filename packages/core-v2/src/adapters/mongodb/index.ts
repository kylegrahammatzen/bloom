import type { DatabaseAdapter } from '@/storage/adapter'
import type { User, Session } from '@/types'
import type { CreateUserData, UpdateUserData, CreateSessionData } from '@/schemas'
import { generateSessionId } from '@/utils/crypto'

export type MongoDatabase = {
  collection: (name: string) => MongoCollection
}

export type MongoCollection = {
  findOne: (filter: any) => Promise<any>
  find: (filter: any) => MongoCursor
  insertOne: (doc: any) => Promise<any>
  updateOne: (filter: any, update: any) => Promise<any>
  deleteOne: (filter: any) => Promise<any>
  deleteMany: (filter: any) => Promise<any>
}

export type MongoCursor = {
  toArray: () => Promise<any[]>
}

export type MongoAdapterOptions = {
  collections?: {
    users?: string
    sessions?: string
  }
}

/**
 * MongoDB adapter for Bloom Core v2
 *
 * @example
 * ```ts
 * import { MongoClient } from 'mongodb'
 * import { mongodbAdapter } from '@bloom/core-v2/adapters/mongodb'
 * import { bloomAuth } from '@bloom/core-v2'
 *
 * const client = new MongoClient('mongodb://localhost:27017')
 * await client.connect()
 * const db = client.db('auth')
 *
 * const auth = bloomAuth({
 *   adapter: mongodbAdapter(db),
 * })
 * ```
 */
export function mongodbAdapter(
  db: MongoDatabase,
  options: MongoAdapterOptions = {}
): DatabaseAdapter {
  const collections = {
    users: options.collections?.users ?? 'users',
    sessions: options.collections?.sessions ?? 'sessions',
  }

  return {
    user: {
      async findById(id: string): Promise<User | null> {
        const user = await db.collection(collections.users).findOne({ _id: id })

        if (!user) return null

        return {
          id: user._id,
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
        const user = await db.collection(collections.users).findOne({ email: normalizedEmail })

        if (!user) return null

        return {
          id: user._id,
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

        const user = {
          _id: id,
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

        await db.collection(collections.users).insertOne(user)

        return {
          id: user._id,
          email: user.email,
          email_verified: user.email_verified,
          name: undefined,
          image: undefined,
          created_at: user.created_at,
          updated_at: user.updated_at,
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

        await db.collection(collections.users).updateOne(
          { _id: id },
          { $set: updates }
        )

        return this.findById(id)
      },

      async delete(id: string): Promise<boolean> {
        const result = await db.collection(collections.users).deleteOne({ _id: id })
        return result.deletedCount > 0
      },
    },

    session: {
      async findById(id: string): Promise<Session | null> {
        const session = await db.collection(collections.sessions).findOne({
          _id: id,
          expires_at: { $gt: new Date() },
        })

        if (!session) return null

        return {
          id: session._id,
          userId: session.user_id,
          expiresAt: session.expires_at,
          createdAt: session.created_at,
          lastAccessedAt: session.last_accessed_at,
        }
      },

      async findByUserId(userId: string): Promise<Session[]> {
        const sessions = await db.collection(collections.sessions)
          .find({
            user_id: userId,
            expires_at: { $gt: new Date() },
          })
          .toArray()

        return sessions.map((session) => ({
          id: session._id,
          userId: session.user_id,
          expiresAt: session.expires_at,
          createdAt: session.created_at,
          lastAccessedAt: session.last_accessed_at,
        }))
      },

      async create(data: CreateSessionData): Promise<Session> {
        const now = new Date()

        const session = {
          _id: data.id,
          user_id: data.userId,
          expires_at: data.expiresAt,
          created_at: now,
          last_accessed_at: now,
        }

        await db.collection(collections.sessions).insertOne(session)

        return {
          id: session._id,
          userId: session.user_id,
          expiresAt: session.expires_at,
          createdAt: session.created_at,
          lastAccessedAt: session.last_accessed_at,
        }
      },

      async updateLastAccessed(id: string): Promise<Session | null> {
        await db.collection(collections.sessions).updateOne(
          { _id: id },
          { $set: { last_accessed_at: new Date() } }
        )

        return this.findById(id)
      },

      async delete(id: string): Promise<boolean> {
        const result = await db.collection(collections.sessions).deleteOne({ _id: id })
        return result.deletedCount > 0
      },

      async deleteByUserId(userId: string): Promise<number> {
        const result = await db.collection(collections.sessions).deleteMany({
          user_id: userId,
        })

        return result.deletedCount
      },

      async deleteExpired(): Promise<number> {
        const result = await db.collection(collections.sessions).deleteMany({
          expires_at: { $lt: new Date() },
        })

        return result.deletedCount
      },
    },
  }
}
