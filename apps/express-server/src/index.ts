import 'dotenv/config';
import { bloomServer } from '@bloom/adapters/express';
import { logger } from '@bloom/core/utils/logger';
import type { AuthEventContext } from '@bloom/core';

bloomServer({
  database: {
    uri: process.env.DATABASE_URL,
  },
  session: {
    secret: process.env.SESSION_SECRET,
  },
  sessionStore: {
    type: 'redis',
    uri: process.env.REDIS_URL,
  },
  emailAndPassword: {
    requireEmailVerification: true,
  },
  callbacks: {
    onAuthEvent: (ctx: AuthEventContext) => {
      logger.info({ action: ctx.action, email: ctx.email, userId: ctx.userId }, 'Auth event');
    },
  },
}).start();