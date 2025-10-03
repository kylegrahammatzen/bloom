import { createAuthHandler } from '@bloom/core/server/nextjs';
import { bloomAuth, logger } from '@bloom/core';
import type { AuthEventContext } from '@bloom/core';
import { connectDB } from '@/lib/db';

export const auth = bloomAuth({
  database: {
    uri: process.env.DATABASE_URL,
  },
  session: {
    secret: process.env.SESSION_SECRET,
    expiresIn: 7 * 24 * 60 * 60 * 1000,
    cookieName: 'bloom.sid',
  },
  sessionStore: {
    type: 'redis',
    uri: process.env.REDIS_URL,
  },
  emailAndPassword: {
    requireEmailVerification: false,
  },
  callbacks: {
    onAuthEvent: (ctx: AuthEventContext) => {
      logger.info({ action: ctx.action, email: ctx.email, userId: ctx.userId }, 'Auth event');
    },
  },
});

const handler = createAuthHandler({ auth, connectDB });

export const GET = handler.GET;
export const POST = handler.POST;
export const DELETE = handler.DELETE;
export const OPTIONS = handler.OPTIONS;
