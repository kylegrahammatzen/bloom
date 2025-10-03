import type { BloomAuth, BloomAuthConfig } from './index';

export type BloomServerConfig = BloomAuthConfig & {
  port?: number;
  cors?: any;
  helmet?: any;
  onReady?: (port: number) => void;
}

export type BloomServerInstance = {
  app: any;
  auth: BloomAuth;
  addRoute: (path: string, handler: any, options?: { protected?: boolean }) => void;
  start: (port?: number) => Promise<void>;
}
