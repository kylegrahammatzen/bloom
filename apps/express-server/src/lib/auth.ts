import { bloomAuth, type Context } from '@bloom/core-v2'
import { mongodbAdapter } from '@bloom/core-v2/adapters/mongodb'
import { db } from '@/lib/db'

export const auth = bloomAuth({
  adapter: mongodbAdapter(db),
  cookieName: 'bloom.sid',
  emailPassword: {
    minPasswordLength: 8,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
  },
  rateLimit: {
    enabled: true,
    window: 60, // 60 seconds
    max: 100, // 100 requests per window
    rules: {
      '/login': { window: 60, max: 5 },
      '/register': { window: 60, max: 3 },
    },
  },
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    prefix: '[Bloom]',
  },
  hooks: {
    '/register': {
      after: async (ctx: Context) => {
        console.log('[Hook] User registered:', { email: ctx.user?.email, id: ctx.user?.id })
      },
    },
    '/login': {
      after: async (ctx: Context) => {
        console.log('[Hook] User logged in:', { email: ctx.user?.email, id: ctx.user?.id })
      },
    },
  },
})
