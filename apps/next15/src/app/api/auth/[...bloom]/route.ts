import { createAuthHandler } from '@bloom/core/server/nextjs';
import { bloomAuth } from '@bloom/core';
import type { AuthEventContext } from '@bloom/core';
import { connectDB } from '@/lib/db';

const auth = bloomAuth({
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
      console.log(`[${ctx.action}] ${ctx.email || ctx.userId || 'unknown'}`);
    },
  },
});

const handler = createAuthHandler({ auth, connectDB });

export const GET = handler.GET;
export const POST = handler.POST;
export const DELETE = handler.DELETE;
