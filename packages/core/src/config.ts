import type { BloomAuthConfig } from '@/types';

export function createDefaultConfig(config: BloomAuthConfig = {}): BloomAuthConfig {
  return {
    session: {
      expiresIn: 7 * 24 * 60 * 60 * 1000,
      cookieName: 'bloom.sid',
      ...config.session,
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      ...config.emailAndPassword,
    },
    rateLimit: {
      enabled: true,
      ...config.rateLimit,
    },
    callbacks: config.callbacks || {},
    plugins: config.plugins || [],
  };
}
