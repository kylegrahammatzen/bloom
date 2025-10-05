import 'dotenv/config';
import { bloomServer } from '@bloom/adapters/express';
import { mongoose, redisStorage } from './lib/auth';
import type { AuthEventContext, SendVerificationEmailContext, SendPasswordResetEmailContext } from '@bloom/core';

bloomServer({
  baseUrl: process.env.BASE_URL || 'http://localhost:5001',
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
    onSendVerificationEmail: async (ctx: SendVerificationEmailContext) => {
      console.log('[Email] Verification email requested', {
        email: ctx.email,
        userId: ctx.userId,
        verificationUrl: ctx.verificationUrl,
      });
    },
    onSendPasswordResetEmail: async (ctx: SendPasswordResetEmailContext) => {
      console.log('[Email] Password reset email requested', {
        email: ctx.email,
        userId: ctx.userId,
        resetUrl: ctx.resetUrl,
      });
    },
  },
  onReady: (port) => {
    console.log(`[Bloom Server] Running on port ${port}`);
    console.log(`[Bloom Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  },
}).start();