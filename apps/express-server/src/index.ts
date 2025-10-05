import 'dotenv/config';
import { bloomServer } from '@bloom/adapters/express';
import { mongoose, redisStorage } from './lib/auth';
import type { AuthEventContext, SendVerificationContext, PasswordResetContext, EmailVerificationContext } from '@bloom/core';

bloomServer({
  baseUrl: process.env.BASE_URL || 'http://localhost:5001',
  database: mongoose,
  session: {
    secret: process.env.SESSION_SECRET,
  },
  secondaryStorage: redisStorage,
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    enabled: true,
    sendOnSignUp: false,
  },
  callbacks: {
    onAuthEvent: (ctx: AuthEventContext) => {
      console.log('[Auth Event]', { action: ctx.action, email: ctx.email, userId: ctx.userId });
    },
    onSendVerification: async (ctx: SendVerificationContext) => {
      console.log('[Email] Sending verification email', {
        email: ctx.email,
        userId: ctx.userId,
        verificationUrl: ctx.verificationUrl,
      });
    },
    onEmailVerification: async (ctx: EmailVerificationContext) => {
      console.log('[Email] Email verified', {
        userId: ctx.userId,
        email: ctx.email,
      });
    },
    onPasswordReset: async (ctx: PasswordResetContext) => {
      console.log('[Email] Sending password reset email', {
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