import type { BloomAuthConfig } from './config';
import type { GenericResponse, Session, GenericRequest } from './api';
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
 * Main Bloom auth instance with normalized config (logger is always Logger type)
 */
export type BloomAuth = {
  config: Omit<BloomAuthConfig, 'logger'> & { logger?: Logger };
  handler: (ctx: BloomHandlerContext) => Promise<GenericResponse>;
  getSession: (sessionId: string) => Promise<Session | null>;
  verifySession: (sessionId: string) => Promise<Session | null>;
}
