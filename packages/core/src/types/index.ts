import type { SessionCookieData } from './session';

export type { SessionCookieData } from './session';

export type User = {
  id: string;
  email: string;
  email_verified: boolean;
  name?: string;
  image?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  lastAccessedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  user?: User;
}

export type GenericRequest = {
  method: string;
  path: string;
  url?: string;
  body?: any;
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  userAgent?: string;
}

export type GenericResponse = {
  status: number;
  body: any;
  sessionData?: SessionCookieData;
  clearSession?: boolean;
}

export type AuthEventContext = {
  action: string;
  userId?: string;
  email?: string;
  endpoint: string;
  ip?: string;
};

export type BloomAuthConfig = {
  database?: {
    provider?: 'mongodb';
    uri?: string;
  };
  session?: {
    expiresIn?: number;
    cookieName?: string;
    secret?: string;
    slidingWindow?: boolean;
  };
  sessionStore?: {
    type?: 'memory' | 'redis' | 'mongo';
    uri?: string;
  };
  emailAndPassword?: {
    enabled?: boolean;
    requireEmailVerification?: boolean;
  };
  rateLimit?: {
    enabled?: boolean;
    login?: {
      max?: number;
      window?: number;
    };
    registration?: {
      max?: number;
      window?: number;
    };
    passwordReset?: {
      max?: number;
      window?: number;
    };
  };
  callbacks?: {
    onSignIn?: (ctx: { user: User; session: Session; ip?: string }) => Promise<void> | void;
    onSignOut?: (ctx: { userId: string; ip?: string }) => Promise<void> | void;
    onRegister?: (ctx: { user: User; session: Session; ip?: string }) => Promise<void> | void;
    onAccountDelete?: (ctx: { userId: string; email: string; ip?: string }) => Promise<void> | void;
    onEmailVerify?: (ctx: { userId: string; email: string; ip?: string }) => Promise<void> | void;
    onPasswordReset?: (ctx: { userId: string; email: string; ip?: string }) => Promise<void> | void;
    onError?: (ctx: { error: Error; endpoint: string; method: string; path: string; userId?: string; ip?: string }) => Promise<void> | void;
    onRateLimit?: (ctx: { ip: string; endpoint: string; limit: { max: number; window: number }; userId?: string }) => Promise<void> | void;
    onAuthEvent?: (ctx: AuthEventContext) => Promise<void> | void;
  };
  plugins?: BloomPlugin[];
}

export type BloomPlugin = {
  name: string;
  init?: (auth: BloomAuth) => void | Promise<void>;
}

export type BloomAuth = {
  config: BloomAuthConfig;
  handler: (ctx: BloomHandlerContext) => Promise<GenericResponse>;
  getSession: (sessionId: string) => Promise<Session | null>;
  verifySession: (sessionId: string) => Promise<Session | null>;
}

export type BloomHandlerContext = {
  request: GenericRequest;
  session?: SessionCookieData;
}
