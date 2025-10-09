import { describe, it, expect, beforeEach } from 'vitest'
import { memoryStorage } from '@/storage/memory'
import type { Storage } from '@/schemas/storage'

describe('memoryStorage', () => {
  let storage: Storage

  beforeEach(() => {
    storage = memoryStorage()
  })

  describe('get/set', () => {
    it('should store and retrieve values', async () => {
      await storage.set('key1', 'value1')
      const value = await storage.get('key1')
      expect(value).toBe('value1')
    })

    it('should return null for non-existent keys', async () => {
      const value = await storage.get('non-existent')
      expect(value).toBeNull()
    })

    it('should overwrite existing values', async () => {
      await storage.set('key1', 'value1')
      await storage.set('key1', 'value2')
      const value = await storage.get('key1')
      expect(value).toBe('value2')
    })

    it('should store multiple key-value pairs', async () => {
      await storage.set('key1', 'value1')
      await storage.set('key2', 'value2')
      await storage.set('key3', 'value3')

      expect(await storage.get('key1')).toBe('value1')
      expect(await storage.get('key2')).toBe('value2')
      expect(await storage.get('key3')).toBe('value3')
    })
  })

  describe('delete', () => {
    it('should delete values', async () => {
      await storage.set('key1', 'value1')
      await storage.delete('key1')
      const value = await storage.get('key1')
      expect(value).toBeNull()
    })

    it('should not throw when deleting non-existent keys', async () => {
      await expect(storage.delete('non-existent')).resolves.toBeUndefined()
    })

    it('should only delete specified key', async () => {
      await storage.set('key1', 'value1')
      await storage.set('key2', 'value2')
      await storage.delete('key1')

      expect(await storage.get('key1')).toBeNull()
      expect(await storage.get('key2')).toBe('value2')
    })
  })

  describe('TTL (Time To Live)', () => {
    it('should expire values after TTL', async () => {
      await storage.set('key1', 'value1', 1)

      await new Promise((resolve) => setTimeout(resolve, 1100))

      const value = await storage.get('key1')
      expect(value).toBeNull()
    })

    it('should return value before TTL expires', async () => {
      await storage.set('key1', 'value1', 2)

      await new Promise((resolve) => setTimeout(resolve, 500))

      const value = await storage.get('key1')
      expect(value).toBe('value1')
    })

    it('should store without expiration if no TTL provided', async () => {
      await storage.set('key1', 'value1')

      await new Promise((resolve) => setTimeout(resolve, 100))

      const value = await storage.get('key1')
      expect(value).toBe('value1')
    })

    it('should update TTL when setting existing key', async () => {
      await storage.set('key1', 'value1', 1)
      await storage.set('key1', 'value2', 10)

      await new Promise((resolve) => setTimeout(resolve, 1100))

      const value = await storage.get('key1')
      expect(value).toBe('value2')
    })
  })

  describe('isolation', () => {
    it('should isolate different storage instances', async () => {
      const storage1 = memoryStorage()
      const storage2 = memoryStorage()

      await storage1.set('key1', 'value1')
      await storage2.set('key1', 'value2')

      expect(await storage1.get('key1')).toBe('value1')
      expect(await storage2.get('key1')).toBe('value2')
    })
  })
})
