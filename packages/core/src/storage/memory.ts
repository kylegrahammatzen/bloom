import type { SecondaryStorage } from '../schemas/storage';

type StorageEntry = {
  value: unknown;
  expires?: number;
};

export class MemoryStorage implements SecondaryStorage {
  private store = new Map<string, StorageEntry>();

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expires && Date.now() > entry.expires) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    this.store.set(key, {
      value,
      expires: ttl ? Date.now() + ttl * 1000 : undefined,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async disconnect(): Promise<void> {
    this.store.clear();
  }
}
