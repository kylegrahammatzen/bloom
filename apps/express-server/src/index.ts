import 'dotenv/config';
import { bloomServer } from '@bloom/adapters/express';
import { mongoose, redisStorage } from './lib/auth';
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
      console.log('[Auth Event]', { action: ctx.action, email: ctx.email, userId: ctx.userId });
    },
  },
  onReady: (port) => {
    console.log(`[Bloom Server] Running on port ${port}`);
    console.log(`[Bloom Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  },
}).start();