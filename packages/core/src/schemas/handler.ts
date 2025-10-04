import type { BloomAuthConfig } from './config';
import type { GenericResponse, Session, GenericRequest } from './api';
import type { SessionCookieData } from './session';

/**
 * Request context passed to all Bloom handlers
 */
export type BloomHandlerContext = {
  request: GenericRequest;
  session?: SessionCookieData;
}

/**
 * Main Bloom auth instance
 */
export type BloomAuth = {
  config: BloomAuthConfig;
  handler: (ctx: BloomHandlerContext) => Promise<GenericResponse>;
  getSession: (sessionId: string) => Promise<Session | null>;
  verifySession: (sessionId: string) => Promise<Session | null>;
}
