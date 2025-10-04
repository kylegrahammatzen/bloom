import { bloomAuth, RedisStorage, createLogger } from '@bloom/core';
import type { AuthEventContext } from '@bloom/core';
import { mongoose } from './db';

const redisStorage = new RedisStorage({
  url: process.env.REDIS_URL!,
  poolSize: 10,
  namespace: 'bloom',
});

const logger = createLogger({ level: 'info', prefix: '[Bloom Auth]' });

export const auth = bloomAuth({
  database: mongoose,
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
  logger,
  callbacks: {
    onAuthEvent: (ctx: AuthEventContext) => {
      logger.info('Auth event', { action: ctx.action, email: ctx.email, userId: ctx.userId });
    },
  },
});
