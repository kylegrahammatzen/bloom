import { createAuthHandler } from '@bloom/adapters/nextjs';
import { bloomAuth } from '@bloom/core';
import type { AuthEventContext } from '@bloom/core';
import { connectDB } from '@/lib/db';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required');
}

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
