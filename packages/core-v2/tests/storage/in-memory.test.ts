import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStorageAdapter } from '@/storage/in-memory'

describe('InMemoryStorageAdapter', () => {
  let storage: InMemoryStorageAdapter

  beforeEach(() => {
    storage = new InMemoryStorageAdapter()
  })

  describe('User operations', () => {
    it('should create a user', async () => {
      const user = await storage.user.create({
        email: 'test@example.com',
        password_hash: 'hash123',
        password_salt: 'salt123',
        email_verified: false,
      })

      expect(user.id).toBeDefined()
      expect(user.email).toBe('test@example.com')
      expect(user.email_verified).toBe(false)
      expect(user.created_at).toBeInstanceOf(Date)
      expect(user.updated_at).toBeInstanceOf(Date)
    })

    it('should normalize email on create', async () => {
      const user = await storage.user.create({
        email: '  TeSt@ExAmPlE.CoM  ',
        password_hash: 'hash123',
        password_salt: 'salt123',
      })

      expect(user.email).toBe('test@example.com')
    })

    it('should reject duplicate emails', async () => {
      await storage.user.create({
        email: 'test@example.com',
        password_hash: 'hash123',
        password_salt: 'salt123',
      })

      await expect(
        storage.user.create({
          email: 'test@example.com',
          password_hash: 'hash456',
          password_salt: 'salt456',
        })
      ).rejects.toThrow('Email already exists')
    })

    it('should find user by id', async () => {
      const created = await storage.user.create({
        email: 'test@example.com',
        password_hash: 'hash123',
        password_salt: 'salt123',
      })

      const found = await storage.user.findById(created.id)
      expect(found).not.toBeNull()
      expect(found?.id).toBe(created.id)
      expect(found?.email).toBe('test@example.com')
    })

    it('should find user by email (case-insensitive)', async () => {
      await storage.user.create({
        email: 'test@example.com',
        password_hash: 'hash123',
        password_salt: 'salt123',
      })

      const found1 = await storage.user.findByEmail('test@example.com')
      const found2 = await storage.user.findByEmail('TEST@EXAMPLE.COM')
      const found3 = await storage.user.findByEmail('  TeSt@ExAmPlE.CoM  ')

      expect(found1).not.toBeNull()
      expect(found2).not.toBeNull()
      expect(found3).not.toBeNull()
      expect(found1?.id).toBe(found2?.id)
      expect(found2?.id).toBe(found3?.id)
    })

    it('should update user', async () => {
      const user = await storage.user.create({
        email: 'test@example.com',
        password_hash: 'hash123',
        password_salt: 'salt123',
        email_verified: false,
      })

      const updated = await storage.user.update(user.id, {
        email_verified: true,
      })

      expect(updated).not.toBeNull()
      expect(updated?.email_verified).toBe(true)
      expect(updated?.updated_at.getTime()).toBeGreaterThanOrEqual(user.updated_at.getTime())
    })

    it('should update user email', async () => {
      const user = await storage.user.create({
        email: 'old@example.com',
        password_hash: 'hash123',
        password_salt: 'salt123',
      })

      const updated = await storage.user.update(user.id, {
        email: 'new@example.com',
      })

      expect(updated?.email).toBe('new@example.com')

      const found = await storage.user.findByEmail('new@example.com')
      expect(found?.id).toBe(user.id)

      const notFound = await storage.user.findByEmail('old@example.com')
      expect(notFound).toBeNull()
    })

    it('should reject duplicate email on update', async () => {
      await storage.user.create({
        email: 'user1@example.com',
        password_hash: 'hash123',
        password_salt: 'salt123',
      })

      const user2 = await storage.user.create({
        email: 'user2@example.com',
        password_hash: 'hash456',
        password_salt: 'salt456',
      })

      await expect(
        storage.user.update(user2.id, {
          email: 'user1@example.com',
        })
      ).rejects.toThrow('Email already exists')
    })

    it('should delete user and their sessions', async () => {
      const user = await storage.user.create({
        email: 'test@example.com',
        password_hash: 'hash123',
        password_salt: 'salt123',
      })

      const session = await storage.session.create({
        id: 'sess_123',
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000),
      })

      const deleted = await storage.user.delete(user.id)
      expect(deleted).toBe(true)

      const foundUser = await storage.user.findById(user.id)
      expect(foundUser).toBeNull()

      const foundSession = await storage.session.findById(session.id)
      expect(foundSession).toBeNull()
    })
  })

  describe('Session operations', () => {
    it('should create a session', async () => {
      const user = await storage.user.create({
        email: 'test@example.com',
        password_hash: 'hash123',
        password_salt: 'salt123',
      })

      const session = await storage.session.create({
        id: 'sess_123',
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        deviceType: 'desktop',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      })

      expect(session.id).toBe('sess_123')
      expect(session.userId).toBe(user.id)
      expect(session.deviceType).toBe('desktop')
      expect(session.ipAddress).toBe('192.168.1.1')
      expect(session.userAgent).toBe('Mozilla/5.0')
      expect(session.createdAt).toBeInstanceOf(Date)
      expect(session.lastAccessedAt).toBeInstanceOf(Date)
    })

    it('should reject session for non-existent user', async () => {
      await expect(
        storage.session.create({
          id: 'sess_123',
          userId: 'nonexistent',
          expiresAt: new Date(),
        })
      ).rejects.toThrow('User not found')
    })

    it('should find session by id', async () => {
      const user = await storage.user.create({
        email: 'test@example.com',
        password_hash: 'hash123',
        password_salt: 'salt123',
      })

      const created = await storage.session.create({
        id: 'sess_123',
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000),
      })

      const found = await storage.session.findById('sess_123')
      expect(found).not.toBeNull()
      expect(found?.id).toBe(created.id)
      expect(found?.userId).toBe(user.id)
    })

    it('should return null for expired session', async () => {
      const user = await storage.user.create({
        email: 'test@example.com',
        password_hash: 'hash123',
        password_salt: 'salt123',
      })

      await storage.session.create({
        id: 'sess_123',
        userId: user.id,
        expiresAt: new Date(Date.now() - 1000), // Expired
      })

      const found = await storage.session.findById('sess_123')
      expect(found).toBeNull()
    })

    it('should find sessions by user id', async () => {
      const user = await storage.user.create({
        email: 'test@example.com',
        password_hash: 'hash123',
        password_salt: 'salt123',
      })

      await storage.session.create({
        id: 'sess_1',
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000),
      })

      await storage.session.create({
        id: 'sess_2',
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000),
      })

      await storage.session.create({
        id: 'sess_expired',
        userId: user.id,
        expiresAt: new Date(Date.now() - 1000),
      })

      const sessions = await storage.session.findByUserId(user.id)
      expect(sessions).toHaveLength(2)
      expect(sessions.map(s => s.id).sort()).toEqual(['sess_1', 'sess_2'])
    })

    it('should update last accessed time', async () => {
      const user = await storage.user.create({
        email: 'test@example.com',
        password_hash: 'hash123',
        password_salt: 'salt123',
      })

      const session = await storage.session.create({
        id: 'sess_123',
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000),
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      const updated = await storage.session.updateLastAccessed('sess_123')
      expect(updated).not.toBeNull()
      expect(updated?.lastAccessedAt.getTime()).toBeGreaterThanOrEqual(
        session.lastAccessedAt.getTime()
      )
    })

    it('should delete session', async () => {
      const user = await storage.user.create({
        email: 'test@example.com',
        password_hash: 'hash123',
        password_salt: 'salt123',
      })

      await storage.session.create({
        id: 'sess_123',
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000),
      })

      const deleted = await storage.session.delete('sess_123')
      expect(deleted).toBe(true)

      const found = await storage.session.findById('sess_123')
      expect(found).toBeNull()
    })

    it('should delete sessions by user id', async () => {
      const user = await storage.user.create({
        email: 'test@example.com',
        password_hash: 'hash123',
        password_salt: 'salt123',
      })

      await storage.session.create({
        id: 'sess_1',
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000),
      })

      await storage.session.create({
        id: 'sess_2',
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000),
      })

      const count = await storage.session.deleteByUserId(user.id)
      expect(count).toBe(2)

      const sessions = await storage.session.findByUserId(user.id)
      expect(sessions).toHaveLength(0)
    })

    it('should delete expired sessions', async () => {
      const user = await storage.user.create({
        email: 'test@example.com',
        password_hash: 'hash123',
        password_salt: 'salt123',
      })

      await storage.session.create({
        id: 'sess_active',
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000),
      })

      await storage.session.create({
        id: 'sess_expired_1',
        userId: user.id,
        expiresAt: new Date(Date.now() - 1000),
      })

      await storage.session.create({
        id: 'sess_expired_2',
        userId: user.id,
        expiresAt: new Date(Date.now() - 2000),
      })

      const count = await storage.session.deleteExpired()
      expect(count).toBe(2)

      const sessions = await storage.session.findByUserId(user.id)
      expect(sessions).toHaveLength(1)
      expect(sessions[0].id).toBe('sess_active')
    })
  })

  describe('Clear operation', () => {
    it('should clear all data', async () => {
      await storage.user.create({
        email: 'test@example.com',
        password_hash: 'hash123',
        password_salt: 'salt123',
      })

      storage.clear()

      const user = await storage.user.findByEmail('test@example.com')
      expect(user).toBeNull()
    })
  })
})
