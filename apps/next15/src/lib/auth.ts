import { bloomAuth, RedisStorage } from '@bloom/core';
import type { AuthEventContext } from '@bloom/core';
import { connectDB } from './db';

const redisStorage = new RedisStorage({
  url: process.env.REDIS_URL!,
  poolSize: 10,
  namespace: 'bloom',
});

await redisStorage.connect();

export const auth = bloomAuth({
  database: {
    uri: process.env.DATABASE_URL,
  },
  session: {
    secret: process.env.SESSION_SECRET,
    expiresIn: 7 * 24 * 60 * 60 * 1000,
    cookieName: 'bloom.sid',
  },
  secondaryStorage: redisStorage,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  callbacks: {
    onAuthEvent: (ctx: AuthEventContext) => {
      // logger.info({ action: ctx.action, email: ctx.email, userId: ctx.userId }, 'Auth event');
    },
  },
});

export { connectDB };
