export type { User, Session, BloomAuthConfig, BloomAuth } from '@/schemas';
import type { BloomAuth, BloomAuthConfig, ApiMethodParams, User, Session } from '@/schemas';
import { User as UserModel, Session as SessionModel } from '@/models';
import { mapSession, mapUser } from '@/utils/mappers';
import { createDefaultConfig } from '@/config';
import { createHandler } from '@/handler';
import { parseSessionCookie } from '@/schemas/session';

export function bloomAuth(config: Partial<BloomAuthConfig> = {}): BloomAuth {
  const defaultConfig = createDefaultConfig(config);

  const auth: BloomAuth = {
    config: defaultConfig,
    handler: createHandler(defaultConfig),
    getSession: async (sessionId: string) => {
      const session = await SessionModel.findOne({ session_id: sessionId });
      if (!session) return null;

      session.last_accessed = new Date();
      await session.save();

      const user = await UserModel.findById(session.user_id);
      if (!user) return null;

      return mapSession(session, user);
    },
    verifySession: async (sessionId: string) => {
      const session = await SessionModel.findOne({ session_id: sessionId });
      if (!session) return null;

      if (session.isExpired()) {
        return null;
      }

      session.last_accessed = new Date();
      if (defaultConfig.session?.slidingWindow) {
        session.extendExpiration(defaultConfig.session.expiresIn ? defaultConfig.session.expiresIn / (24 * 60 * 60 * 1000) : 7);
      }
      await session.save();

      const user = await UserModel.findById(session.user_id);
      if (!user) return null;

      return mapSession(session, user);
    },
    api: {
      session: {
        get: async (params: ApiMethodParams) => {
          const cookieName = defaultConfig.session?.cookieName || 'bloom.sid';
          const cookieValue = params.headers?.['cookie'] || params.headers?.['Cookie'];

          if (!cookieValue || typeof cookieValue !== 'string') {
            return null;
          }

          const cookies = parseCookies(cookieValue);
          const sessionCookie = cookies[cookieName];

          if (!sessionCookie) {
            return null;
          }

          const sessionData = parseSessionCookie(sessionCookie);
          if (!sessionData) {
            return null;
          }

          const session = await SessionModel.findOne({ session_id: sessionData.sessionId });
          if (!session || session.isExpired()) {
            return null;
          }

          session.last_accessed = new Date();
          await session.save();

          const user = await UserModel.findById(session.user_id);
          if (!user) {
            return null;
          }

          return {
            user: mapUser(user),
            session: mapSession(session, user)
          };
        },
        verify: async (params: ApiMethodParams) => {
          const cookieName = defaultConfig.session?.cookieName || 'bloom.sid';
          const cookieValue = params.headers?.['cookie'] || params.headers?.['Cookie'];

          if (!cookieValue || typeof cookieValue !== 'string') {
            return null;
          }

          const cookies = parseCookies(cookieValue);
          const sessionCookie = cookies[cookieName];

          if (!sessionCookie) {
            return null;
          }

          const sessionData = parseSessionCookie(sessionCookie);
          if (!sessionData) {
            return null;
          }

          const session = await SessionModel.findOne({ session_id: sessionData.sessionId });
          if (!session || session.isExpired()) {
            return null;
          }

          session.last_accessed = new Date();
          if (defaultConfig.session?.slidingWindow) {
            session.extendExpiration(defaultConfig.session.expiresIn ? defaultConfig.session.expiresIn / (24 * 60 * 60 * 1000) : 7);
          }
          await session.save();

          const user = await UserModel.findById(session.user_id);
          if (!user) {
            return null;
          }

          return {
            user: mapUser(user),
            session: mapSession(session, user)
          };
        }
      }
    },
    $Infer: {
      User: {} as User,
      Session: {} as Session
    }
  };

  // Register plugins
  if (defaultConfig.plugins) {
    for (const plugin of defaultConfig.plugins) {
      // Call plugin init hook to register API methods
      if (plugin.init) {
        plugin.init(auth);
      }
    }
  }

  return auth;
}

/**
 * Simple cookie parser helper
 */
function parseCookies(cookieString: string): Record<string, string> {
  return cookieString.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {} as Record<string, string>);
}