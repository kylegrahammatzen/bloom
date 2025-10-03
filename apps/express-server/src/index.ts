import 'dotenv/config';
import { bloomServer } from '@bloom/core/server/express';
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
      console.log(`[${ctx.action}] ${ctx.email || ctx.userId || 'unknown'}${ctx.userId ? ` (${ctx.userId})` : ''}`);
    },
  },
}).start();