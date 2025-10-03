import type { BloomAuth, BloomAuthConfig } from './index';

export type SessionStoreConfig = {
  type?: 'memory' | 'mongo' | 'redis';
  uri?: string;
};

export type BloomServerConfig = BloomAuthConfig & {
  port?: number;
  cors?: any;
  helmet?: any;
  sessionStore?: SessionStoreConfig;
  onReady?: (port: number) => void;
}

export type BloomServerInstance = {
  app: any;
  auth: BloomAuth;
  addRoute: (path: string, handler: any, options?: { protected?: boolean }) => void;
  start: (port?: number) => Promise<void>;
}
