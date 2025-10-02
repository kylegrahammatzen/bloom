import dotenv from 'dotenv';
dotenv.config();

import { bloomServer } from '@bloom/server/express';
import { bloomAuth } from '@bloom/core';

const auth = bloomAuth({
  database: {
    provider: "mongodb",
    uri:
      process.env.MONGODB_URI ||
      "mongodb://bloom:bloom-dev-password@localhost:27017/bloom-auth",
  },
  session: {
    expiresIn: 7 * 24 * 60 * 60 * 1000,
    cookieName: "bloom.sid",
    secret:
      process.env.SESSION_SECRET || "bloom-dev-secret-change-in-production",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  rateLimit: {
    enabled: true,
    login: {
      max: 5,
      window: 15 * 60 * 1000,
    },
    registration: {
      max: 3,
      window: 60 * 60 * 1000,
    },
    passwordReset: {
      max: 3,
      window: 60 * 60 * 1000,
    },
  },
  callbacks: {
    onSignIn: async (ctx) => {
      console.log(`User signed in: ${ctx.user.email} (Session: ${ctx.session.id})`);
    },
    onSignOut: async (ctx) => {
      console.log(`User signed out: ${ctx.userId}`);
    },
    onRegister: async (ctx) => {
      console.log(`New user registered: ${ctx.user.email}`);
    },
    onError: async (ctx) => {
      console.error(`Auth error on ${ctx.method} ${ctx.endpoint}:`, ctx.error.message, {
        userId: ctx.userId,
        ip: ctx.ip,
      });
    },
    onRateLimit: async (ctx) => {
      console.warn(`Rate limit hit: ${ctx.ip} on ${ctx.endpoint}`, {
        userId: ctx.userId,
        limit: `${ctx.limit.max}/${ctx.limit.window}ms`,
      });
    },
  },
});

const server = bloomServer({ auth });

server.start();
