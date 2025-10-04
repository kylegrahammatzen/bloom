import type { BloomAuth } from './handler';
import type { BloomAuthConfig } from './config';
import type { SessionCookieData } from './session';

/**
 * Express server types
 */
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

/**
 * Next.js server types
 */
export type NextAuthHandlerConfig = {
  auth: BloomAuth;
  connectDB?: () => Promise<void>;
  cors?: {
    origin?: string | string[];
    credentials?: boolean;
  } | false;
};

export type BloomMiddlewareConfig = {
  protectedRoutes?: string[];
  afterAuth?: (request: any, session: SessionCookieData | null) => any | Promise<any>;
  cookieName?: string;
};

export type BloomSession = {
  userId: string;
  sessionId: string;
} | null;
