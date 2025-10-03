import 'dotenv/config';
import { bloomServer } from '@bloom/core/server/express';

bloomServer({
  database: {
    uri: process.env.MONGODB_URI || "mongodb://bloom:bloom-dev-password@localhost:27017/bloom-auth?authSource=admin",
  },
  session: {
    secret: process.env.SESSION_SECRET || "bloom-dev-secret-change-in-production",
  },
  emailAndPassword: {
    requireEmailVerification: true,
  },
  callbacks: {
    onAuthEvent: (ctx) => {
      console.log(`[${ctx.action}] ${ctx.email || ctx.userId || 'unknown'}${ctx.userId ? ` (${ctx.userId})` : ''}`);
    },
  },
}).start();