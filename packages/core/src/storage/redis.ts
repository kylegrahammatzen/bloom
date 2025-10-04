import { createClient, RedisClientType } from 'redis';
import type { SecondaryStorage, RedisStorageConfig } from '../schemas/storage';

const clientCache = new Map<string, RedisClientType>();

export class RedisStorage implements SecondaryStorage {
  private client: RedisClientType;
  private namespace: string;

  constructor(config: RedisStorageConfig) {
    this.namespace = config.namespace || 'bloom';

    const cacheKey = `${config.url}:${config.poolSize || 10}`;

    if (!clientCache.has(cacheKey)) {
      clientCache.set(cacheKey, createClient({
        url: config.url,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries: number) => {
            if (retries > 10) return new Error('Max retries reached');
            return Math.min(retries * 100, 3000);
          },
        },
        isolationPoolOptions: {
          min: 2,
          max: config.poolSize || 10,
        },
      }));
    }

    this.client = clientCache.get(cacheKey)!;
  }

  private key(k: string): string {
    return `${this.namespace}:${k}`;
  }

  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const value = await this.client.get(this.key(key));
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.client.set(this.key(key), serialized, { EX: ttl });
    } else {
      await this.client.set(this.key(key), serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(this.key(key));
  }

  async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }
}
