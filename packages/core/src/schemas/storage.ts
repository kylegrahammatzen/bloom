export interface SecondaryStorage {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  disconnect(): Promise<void>;
}

export type RedisStorageConfig = {
  url: string;
  poolSize?: number;
  namespace?: string;
};
