import type { BloomAuthConfig } from './config';
import type { GenericResponse, Session, User, GenericRequest } from './api';
import type { SessionCookieData } from './session';
import type { Logger } from './logger';

/**
 * Request context passed to all Bloom handlers
 */
export type BloomHandlerContext = {
  request: GenericRequest;
  session?: SessionCookieData;
}

/**
 * API method parameter structure (Better Auth style)
 */
export type ApiMethodParams = {
  headers?: Record<string, string | string[] | undefined>;
  body?: Record<string, any>;
  query?: Record<string, any>;
}

/**
 * Base API methods available on all Bloom instances
 */
export type BloomAuthApi = {
  session: {
    get: (params: ApiMethodParams) => Promise<{ user: User; session: Session } | null>;
    verify: (params: ApiMethodParams) => Promise<{ user: User; session: Session } | null>;
  };
  [key: string]: any; // Allow plugin extensions
}

/**
 * Type inference object for User and Session types
 */
export type BloomAuthInfer = {
  User: User;
  Session: Session;
}

/**
 * Main Bloom auth instance with normalized config (logger is always Logger type)
 */
export type BloomAuth = {
  config: Omit<BloomAuthConfig, 'logger'> & { logger?: Logger };
  handler: (ctx: BloomHandlerContext) => Promise<GenericResponse>;
  getSession: (sessionId: string) => Promise<Session | null>;
  verifySession: (sessionId: string) => Promise<Session | null>;
  api: BloomAuthApi;
  $Infer: BloomAuthInfer;
}
