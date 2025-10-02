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
  sessionData?: {
    userId: string;
    sessionId: string;
  };
  clearSession?: boolean;
}

export type BloomAuthConfig = {
  database?: {
    provider?: 'mongodb';
    uri?: string;
  };
  session?: {
    expiresIn?: number;
    cookieName?: string;
    secret?: string;
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
    onSignIn?: (ctx: { user: User; session: Session }) => Promise<void> | void;
    onSignOut?: (ctx: { userId: string }) => Promise<void> | void;
    onRegister?: (ctx: { user: User; session: Session }) => Promise<void> | void;
    onError?: (ctx: { error: Error; endpoint: string; method: string; path: string; userId?: string; ip?: string }) => Promise<void> | void;
    onRateLimit?: (ctx: { ip: string; endpoint: string; limit: { max: number; window: number }; userId?: string }) => Promise<void> | void;
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
  session?: {
    userId?: string;
    sessionId?: string;
  };
}
