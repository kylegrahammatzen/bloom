import 'dotenv/config';
import { bloomServer } from '@bloom/adapters/express';
import { mongoose, redisStorage } from './lib/auth';
import { logger } from '@bloom/core/utils/logger';
import type { AuthEventContext } from '@bloom/core';

bloomServer({
  database: mongoose,
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