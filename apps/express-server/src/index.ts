import 'dotenv/config';
import { bloomServer } from '@bloom/adapters/express';
import { RedisStorage } from '@bloom/core';
import { logger } from '@bloom/core/utils/logger';
import type { AuthEventContext } from '@bloom/core';

const redisStorage = new RedisStorage({
  url: process.env.REDIS_URL!,
  poolSize: 10,
  namespace: 'bloom',
});

await redisStorage.connect();

bloomServer({
  database: {
    uri: process.env.DATABASE_URL,
  },
  session: {
    secret: process.env.SESSION_SECRET,
  },
  secondaryStorage: redisStorage,
  emailAndPassword: {
    requireEmailVerification: true,
  },
  callbacks: {
    onAuthEvent: (ctx: AuthEventContext) => {
      logger.info({ action: ctx.action, email: ctx.email, userId: ctx.userId }, 'Auth event');
    },
  },
}).start();