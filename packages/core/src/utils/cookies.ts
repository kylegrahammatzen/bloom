import type { BloomAuthConfig } from '@/schemas';

export const getCookieName = (config: BloomAuthConfig) =>
  config.session?.cookieName || 'bloom.sid';

export const getCookieOptions = (config: BloomAuthConfig) => {
  const maxAge = config.session?.expiresIn || 7 * 24 * 60 * 60 * 1000;
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
};

export const getCookieOptionsForNextJS = (config: BloomAuthConfig) => {
  const opts = getCookieOptions(config);
  return { ...opts, maxAge: Math.floor(opts.maxAge / 1000) };
};
