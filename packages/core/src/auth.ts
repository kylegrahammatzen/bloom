export type { User, Session, BloomAuthConfig, BloomAuth } from '@/types';
import type { BloomAuth, BloomAuthConfig } from '@/types';
import { User as UserModel, Session as SessionModel } from '@/models';
import { mapSession } from '@/utils/mappers';
import { createDefaultConfig } from '@/config';
import { createHandler } from '@/handler';

export function bloomAuth(config: BloomAuthConfig = {}): BloomAuth {
  const defaultConfig = createDefaultConfig(config);

  const auth: BloomAuth = {
    config: defaultConfig,
    handler: createHandler(defaultConfig),
    getSession: async (sessionId: string) => {
      const session = await SessionModel.findOne({ session_id: sessionId });
      if (!session) return null;

      const user = await UserModel.findById(session.user_id);
      if (!user) return null;

      return mapSession(session, user);
    },
    verifySession: async (sessionId: string) => {
      return auth.getSession(sessionId);
    },
  };

  if (defaultConfig.plugins) {
    for (const plugin of defaultConfig.plugins) {
      if (plugin.init) {
        plugin.init(auth);
      }
    }
  }

  return auth;
}