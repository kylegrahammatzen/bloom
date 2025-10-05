import { bloomAuth, RedisStorage, createLogger, sessions } from '@bloom/core';
import type { AuthEventContext, SendVerificationContext, PasswordResetContext, EmailVerificationContext } from '@bloom/core';
import { mongoose } from './db';

const redisStorage = new RedisStorage({
  url: process.env.REDIS_URL!,
  poolSize: 10,
  namespace: 'bloom',
});

const logger = createLogger({ level: 'info', prefix: '[Bloom Auth]' });

export const auth = bloomAuth({
  baseUrl: process.env.BASE_URL,
  database: mongoose,
  session: {
    secret: process.env.SESSION_SECRET,
    expiresIn: 7 * 24 * 60 * 60 * 1000,
    cookieName: 'bloom.sid',
  },
  secondaryStorage: redisStorage,
  emailAndPassword: {
    enabled: true,
    emailVerification: {
      enabled: true,
      sendOnSignUp: false,
      callbackUrl: '/',
    },
  },
  rateLimit: {
    enabled: true,
    emailVerification: {
      max: 3,
      window: 60 * 1000, // 60 seconds
    },
    passwordReset: {
      max: 3,
      window: 60 * 1000, // 60 seconds
    },
  },
  logger,
  plugins: [
    sessions(),
  ],
  callbacks: {
    onAuthEvent: (ctx: AuthEventContext) => {
      logger.info('Auth event', { action: ctx.action, email: ctx.email, userId: ctx.userId });
    },
    onSendVerification: async (ctx: SendVerificationContext) => {
      logger.info('Sending verification email', {
        email: ctx.email,
        userId: ctx.userId,
        verificationUrl: ctx.verificationUrl,
      });
    },
    onEmailVerification: async (ctx: EmailVerificationContext) => {
      logger.info('Email verified', {
        userId: ctx.userId,
        email: ctx.email,
      });
    },
    onPasswordReset: async (ctx: PasswordResetContext) => {
      logger.info('Sending password reset email', {
        email: ctx.email,
        userId: ctx.userId,
        resetUrl: ctx.resetUrl,
      });
    },
  },
});
