import { bloomAuth, RedisStorage, createLogger, sessions } from '@bloom/core';
import type { AuthEventContext, SendVerificationEmailContext, SendPasswordResetEmailContext } from '@bloom/core';
import { mongoose } from './db';

const redisStorage = new RedisStorage({
  url: process.env.REDIS_URL!,
  poolSize: 10,
  namespace: 'bloom',
});

const logger = createLogger({ level: 'info', prefix: '[Bloom Auth]' });

export const auth = bloomAuth({
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  database: mongoose,
  session: {
    secret: process.env.SESSION_SECRET,
    expiresIn: 7 * 24 * 60 * 60 * 1000,
    cookieName: 'bloom.sid',
  },
  secondaryStorage: redisStorage,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  logger,
  plugins: [
    sessions(),
  ],
  callbacks: {
    onAuthEvent: (ctx: AuthEventContext) => {
      logger.info('Auth event', { action: ctx.action, email: ctx.email, userId: ctx.userId });
    },
    onSendVerificationEmail: async (ctx: SendVerificationEmailContext) => {
      logger.info('Verification email requested', {
        email: ctx.email,
        userId: ctx.userId,
        verificationUrl: ctx.verificationUrl,
      });
    },
    onSendPasswordResetEmail: async (ctx: SendPasswordResetEmailContext) => {
      logger.info('Password reset email requested', {
        email: ctx.email,
        userId: ctx.userId,
        resetUrl: ctx.resetUrl,
      });
    },
  },
});
