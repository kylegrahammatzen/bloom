/**
 * Framework-agnostic cookie configuration
 */
export type CookieConfig = {
  name: string;
  maxAge: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  domain?: string;
};

/**
 * Express cookie options (maxAge in milliseconds)
 */
export type ExpressCookieOptions = CookieConfig;

/**
 * Next.js cookie options (maxAge in seconds)
 */
export type NextCookieOptions = Omit<CookieConfig, 'name'> & {
  maxAge: number;
};
