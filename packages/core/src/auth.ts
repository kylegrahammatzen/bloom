import type { BloomAuthConfig, BloomAuth, BloomHandlerContext, User, Session, GenericResponse, GenericRequest } from './types';
import { User as UserModel, UserCredentials, Session as SessionModel, Token } from './models';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
  generateSessionId,
  normalizeEmail,
  checkPasswordStrength,
  isValidEmail
} from './utils/crypto';
import { checkRateLimit, trackAttempt } from './utils/rateLimit';
import { createRouter, addRoute, findRoute } from './utils/router';
import { APIError, APIErrorCode } from './types/errors';
import { createSuccess } from './utils/response';

export function bloomAuth(config: BloomAuthConfig = {}): BloomAuth {
  const defaultConfig: BloomAuthConfig = {
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

  const auth: BloomAuth = {
    config: defaultConfig,
    handler: createHandler(defaultConfig),
    getSession: async (sessionId: string) => {
      const session = await SessionModel.findOne({ session_id: sessionId });
      if (!session) return null;

      const user = await UserModel.findById(session.user_id);
      if (!user) return null;

      return {
        id: session.session_id,
        userId: session.user_id.toString(),
        expiresAt: session.expires_at,
        createdAt: session.created_at,
        lastAccessedAt: session.last_accessed,
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        user: {
          id: user._id.toString(),
          email: user.email,
          email_verified: user.email_verified,
          name: user.name,
          image: user.image,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login: user.last_login,
        },
      };
    },
    verifySession: async (sessionId: string) => {
      return auth.getSession(sessionId);
    },
  };

  if (defaultConfig.plugins) {
    for (const plugin of defaultConfig.plugins) {
      if (plugin.init) {
        plugin.init(auth);
      }
    }
  }

  return auth;
}

function createHandler(config: BloomAuthConfig) {
  const router = createRouter();

  // Define auth routes
  addRoute(router, 'POST', '/register', async (ctx: BloomHandlerContext) =>
    handleRegister(ctx, config));
  addRoute(router, 'POST', '/login', async (ctx: BloomHandlerContext) =>
    handleLogin(ctx, config));
  addRoute(router, 'POST', '/logout', async (ctx: BloomHandlerContext) =>
    handleLogout(ctx, config));
  addRoute(router, 'GET', '/me', async (ctx: BloomHandlerContext) =>
    handleGetSession(ctx));
  addRoute(router, 'POST', '/verify-email', async (ctx: BloomHandlerContext) =>
    handleVerifyEmail(ctx, config));
  addRoute(router, 'POST', '/request-password-reset', async (ctx: BloomHandlerContext) =>
    handleRequestPasswordReset(ctx, config));
  addRoute(router, 'POST', '/reset-password', async (ctx: BloomHandlerContext) =>
    handleResetPassword(ctx, config));
  addRoute(router, 'DELETE', '/account', async (ctx: BloomHandlerContext) =>
    handleDeleteAccount(ctx, config));

  return async (ctx: BloomHandlerContext): Promise<GenericResponse> => {
    const method = ctx.request.method;
    const path = ctx.request.path || ctx.request.url || '';
    const normalizedPath = path.replace(/^\/api\/auth/, '');

    try {
      const match = findRoute(router, method, normalizedPath);

      if (!match) {
        return new APIError(APIErrorCode.ENDPOINT_NOT_FOUND).toResponse();
      }

      const handler = match.data as (ctx: BloomHandlerContext) => Promise<GenericResponse>;
      return await handler(ctx);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Internal server error');

      if (config.callbacks?.onError) {
        await config.callbacks.onError({
          error: err,
          endpoint: normalizedPath,
          method,
          path,
          userId: ctx.session?.userId,
          ip: ctx.request.ip
        });
      }

      return new APIError(APIErrorCode.INTERNAL_ERROR).toResponse();
    }
  };
}

async function handleRegister(ctx: BloomHandlerContext, config: BloomAuthConfig): Promise<GenericResponse> {
  const { email, password } = ctx.request.body;

  // Rate limiting
  if (config.rateLimit?.enabled && config.rateLimit.registration) {
    const rateLimitConfig = config.rateLimit.registration;
    if (rateLimitConfig.max && rateLimitConfig.window) {
      const rateLimitKey = `register:${ctx.request.ip || 'unknown'}`;
      const rateLimit = checkRateLimit(rateLimitKey, {
        max: rateLimitConfig.max,
        window: rateLimitConfig.window
      });

      if (rateLimit.isLimited) {
        if (config.callbacks?.onRateLimit) {
          await config.callbacks.onRateLimit({
            ip: ctx.request.ip || 'unknown',
            endpoint: '/register',
            limit: { max: rateLimitConfig.max, window: rateLimitConfig.window },
            userId: ctx.session?.userId
          });
        }

        return new APIError(APIErrorCode.RATE_LIMITED, { resetAt: rateLimit.resetAt }).toResponse();
      }

      trackAttempt(rateLimitKey);
    }
  }

  if (!email || !isValidEmail(email)) {
    return new APIError(APIErrorCode.INVALID_EMAIL).toResponse();
  }

  if (!password || password.length < 8 || password.length > 256) {
    return new APIError(APIErrorCode.PASSWORD_REQUIRED).toResponse();
  }

  const normalizedEmail = normalizeEmail(email);
  const passwordCheck = checkPasswordStrength(password);

  if (!passwordCheck.isStrong) {
    return new APIError(APIErrorCode.WEAK_PASSWORD, passwordCheck.issues).toResponse();
  }

  const existingUser = await UserModel.findOne({ email: normalizedEmail });
  if (existingUser) {
    return new APIError(APIErrorCode.EMAIL_ALREADY_EXISTS).toResponse();
  }

  const user = new UserModel({ email: normalizedEmail });
  await user.save();

  const { hash, salt } = await hashPassword(password);
  const credentials = new UserCredentials({
    user_id: user._id,
    password_hash: hash,
    salt,
  });
  await credentials.save();

  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const verificationToken = new Token({
    token_hash: tokenHash,
    type: 'email_verification',
    user_id: user._id,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  await verificationToken.save();

  const sessionId = generateSessionId();
  const session = new SessionModel({
    session_id: sessionId,
    user_id: user._id,
    expires_at: new Date(Date.now() + (config.session?.expiresIn || 7 * 24 * 60 * 60 * 1000)),
    user_agent: ctx.request.userAgent || ctx.request.headers?.['user-agent'],
    ip_address: ctx.request.ip,
  });
  await session.save();

  const responseData = {
    message: 'Registration successful',
    user: {
      id: user._id,
      email: user.email,
      email_verified: user.email_verified,
      name: user.name,
      image: user.image,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
    session: {
      id: session.session_id,
      userId: session.user_id.toString(),
      expiresAt: session.expires_at,
      createdAt: session.created_at,
      lastAccessedAt: session.last_accessed,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
    },
  };

  if (config.callbacks?.onRegister) {
    await config.callbacks.onRegister({ user: responseData.user, session: responseData.session, ip: ctx.request.ip });
  }

  if (config.callbacks?.onAuthEvent) {
    await config.callbacks.onAuthEvent({ action: 'register', userId: user._id.toString(), email: user.email, endpoint: '/register', ip: ctx.request.ip });
  }

  return {
    status: 201,
    body: responseData,
    sessionData: {
      userId: user._id.toString(),
      sessionId: sessionId,
    },
  };
}

async function handleLogin(ctx: BloomHandlerContext, config: BloomAuthConfig): Promise<GenericResponse> {
  const { email, password } = ctx.request.body;

  // Rate limiting
  if (config.rateLimit?.enabled && config.rateLimit.login) {
    const rateLimitConfig = config.rateLimit.login;
    if (rateLimitConfig.max && rateLimitConfig.window) {
      const rateLimitKey = `login:${ctx.request.ip || 'unknown'}`;
      const rateLimit = checkRateLimit(rateLimitKey, {
        max: rateLimitConfig.max,
        window: rateLimitConfig.window
      });

      if (rateLimit.isLimited) {
        if (config.callbacks?.onRateLimit) {
          await config.callbacks.onRateLimit({
            ip: ctx.request.ip || 'unknown',
            endpoint: '/login',
            limit: { max: rateLimitConfig.max, window: rateLimitConfig.window },
            userId: ctx.session?.userId
          });
        }

        return new APIError(APIErrorCode.RATE_LIMITED, { resetAt: rateLimit.resetAt }).toResponse();
      }

      trackAttempt(rateLimitKey);
    }
  }

  if (!email || !password) {
    return new APIError(APIErrorCode.INVALID_CREDENTIALS).toResponse();
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await UserModel.findOne({ email: normalizedEmail });

  if (!user) {
    return new APIError(APIErrorCode.INVALID_CREDENTIALS).toResponse();
  }

  const credentials = await UserCredentials.findOne({ user_id: user._id });
  if (!credentials) {
    return new APIError(APIErrorCode.INVALID_CREDENTIALS).toResponse();
  }

  if (credentials.isAccountLocked()) {
    return new APIError(APIErrorCode.ACCOUNT_LOCKED).toResponse();
  }

  const isValidPassword = await verifyPassword(password, credentials.password_hash, credentials.salt);
  if (!isValidPassword) {
    await credentials.incrementLoginAttempts();
    return new APIError(APIErrorCode.INVALID_CREDENTIALS).toResponse();
  }

  await credentials.resetLoginAttempts();
  user.last_login = new Date();
  await user.save();

  const sessionId = generateSessionId();
  const newSession = new SessionModel({
    session_id: sessionId,
    user_id: user._id,
    expires_at: new Date(Date.now() + (config.session?.expiresIn || 7 * 24 * 60 * 60 * 1000)),
    user_agent: ctx.request.userAgent || ctx.request.headers?.['user-agent'],
    ip_address: ctx.request.ip,
  });
  await newSession.save();

  const responseData = {
    message: 'Login successful',
    user: {
      id: user._id,
      email: user.email,
      email_verified: user.email_verified,
      name: user.name,
      image: user.image,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login,
    },
    session: {
      id: newSession.session_id,
      userId: newSession.user_id.toString(),
      expiresAt: newSession.expires_at,
      createdAt: newSession.created_at,
      lastAccessedAt: newSession.last_accessed,
      ipAddress: newSession.ip_address,
      userAgent: newSession.user_agent,
    },
  };

  if (config.callbacks?.onSignIn) {
    await config.callbacks.onSignIn({ user: responseData.user, session: responseData.session, ip: ctx.request.ip });
  }

  if (config.callbacks?.onAuthEvent) {
    await config.callbacks.onAuthEvent({ action: 'login', userId: user._id.toString(), email: user.email, endpoint: '/login', ip: ctx.request.ip });
  }

  return {
    status: 200,
    body: responseData,
    sessionData: {
      userId: user._id.toString(),
      sessionId: sessionId,
    },
  };
}

async function handleLogout(ctx: BloomHandlerContext, config: BloomAuthConfig): Promise<GenericResponse> {
  const userId = ctx.session?.userId;

  if (ctx.session?.sessionId) {
    await SessionModel.deleteOne({ session_id: ctx.session.sessionId });
  }

  if (config.callbacks?.onSignOut && userId) {
    await config.callbacks.onSignOut({ userId, ip: ctx.request.ip });
  }

  if (config.callbacks?.onAuthEvent && userId) {
    await config.callbacks.onAuthEvent({ action: 'logout', userId, endpoint: '/logout', ip: ctx.request.ip });
  }

  return {
    status: 200,
    body: { message: 'Logout successful' },
    clearSession: true,
  };
}

async function handleGetSession(ctx: BloomHandlerContext): Promise<GenericResponse> {
  if (!ctx.session?.userId) {
    return new APIError(APIErrorCode.NOT_AUTHENTICATED).toResponse();
  }

  const user = await UserModel.findById(ctx.session.userId);
  if (!user) {
    return new APIError(APIErrorCode.USER_NOT_FOUND).toResponse();
  }

  const userSession = await SessionModel.findOne({ session_id: ctx.session.sessionId });
  if (!userSession) {
    return new APIError(APIErrorCode.SESSION_NOT_FOUND).toResponse();
  }

  return {
    status: 200,
    body: {
      user: {
        id: user._id,
        email: user.email,
        email_verified: user.email_verified,
        name: user.name,
        image: user.image,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login,
      },
      session: {
        id: userSession.session_id,
        userId: userSession.user_id.toString(),
        expiresAt: userSession.expires_at,
        createdAt: userSession.created_at,
        lastAccessedAt: userSession.last_accessed,
        ipAddress: userSession.ip_address,
        userAgent: userSession.user_agent,
      },
    },
  };
}

async function handleVerifyEmail(ctx: BloomHandlerContext, config: BloomAuthConfig): Promise<GenericResponse> {
  const { token } = ctx.request.body;

  if (!token) {
    return new APIError(APIErrorCode.TOKEN_REQUIRED).toResponse();
  }

  const tokenHash = hashToken(token);
  const verificationToken = await Token.findOne({
    token_hash: tokenHash,
    type: 'email_verification',
  });

  if (!verificationToken || !verificationToken.isValid()) {
    return new APIError(APIErrorCode.INVALID_TOKEN).toResponse();
  }

  const user = await UserModel.findById(verificationToken.user_id);
  if (!user) {
    return new APIError(APIErrorCode.USER_NOT_FOUND).toResponse();
  }

  user.email_verified = true;
  await user.save();
  await verificationToken.markAsUsed();

  if (config.callbacks?.onEmailVerify) {
    await config.callbacks.onEmailVerify({ userId: user._id.toString(), email: user.email, ip: ctx.request.ip });
  }

  if (config.callbacks?.onAuthEvent) {
    await config.callbacks.onAuthEvent({ action: 'email_verify', userId: user._id.toString(), email: user.email, endpoint: '/verify-email', ip: ctx.request.ip });
  }

  return {
    status: 200,
    body: {
      message: 'Email verified successfully',
      user: {
        id: user._id,
        email: user.email,
        email_verified: user.email_verified,
      },
    },
  };
}

async function handleRequestPasswordReset(ctx: BloomHandlerContext, config: BloomAuthConfig): Promise<GenericResponse> {
  const { email } = ctx.request.body;

  // Rate limiting
  if (config.rateLimit?.enabled && config.rateLimit.passwordReset) {
    const rateLimitConfig = config.rateLimit.passwordReset;
    if (rateLimitConfig.max && rateLimitConfig.window) {
      const rateLimitKey = `password-reset:${ctx.request.ip || 'unknown'}`;
      const rateLimit = checkRateLimit(rateLimitKey, {
        max: rateLimitConfig.max,
        window: rateLimitConfig.window
      });

      if (rateLimit.isLimited) {
        if (config.callbacks?.onRateLimit) {
          await config.callbacks.onRateLimit({
            ip: ctx.request.ip || 'unknown',
            endpoint: '/request-password-reset',
            limit: { max: rateLimitConfig.max, window: rateLimitConfig.window },
            userId: ctx.session?.userId
          });
        }

        return new APIError(APIErrorCode.RATE_LIMITED, { resetAt: rateLimit.resetAt }).toResponse();
      }

      trackAttempt(rateLimitKey);
    }
  }

  if (!email || !isValidEmail(email)) {
    return new APIError(APIErrorCode.INVALID_EMAIL).toResponse();
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await UserModel.findOne({ email: normalizedEmail });

  const successResponse = {
    message: 'If an account with this email exists, a password reset link has been sent.',
  };

  if (!user) {
    return { status: 200, body: successResponse };
  }

  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const resetToken = new Token({
    token_hash: tokenHash,
    type: 'password_reset',
    user_id: user._id,
    expires_at: new Date(Date.now() + 60 * 60 * 1000),
  });
  await resetToken.save();

  return {
    status: 200,
    body: successResponse,
  };
}

async function handleResetPassword(ctx: BloomHandlerContext, config: BloomAuthConfig): Promise<GenericResponse> {
  const { token, password } = ctx.request.body;

  if (!token || !password) {
    return new APIError(APIErrorCode.TOKEN_REQUIRED).toResponse();
  }

  const passwordCheck = checkPasswordStrength(password);
  if (!passwordCheck.isStrong) {
    return new APIError(APIErrorCode.WEAK_PASSWORD, passwordCheck.issues).toResponse();
  }

  const tokenHash = hashToken(token);
  const resetToken = await Token.findOne({
    token_hash: tokenHash,
    type: 'password_reset',
  });

  if (!resetToken || !resetToken.isValid()) {
    return new APIError(APIErrorCode.INVALID_TOKEN).toResponse();
  }

  const user = await UserModel.findById(resetToken.user_id);
  if (!user) {
    return new APIError(APIErrorCode.USER_NOT_FOUND).toResponse();
  }

  const { hash, salt } = await hashPassword(password);
  await UserCredentials.updateOne(
    { user_id: user._id },
    { $set: { password_hash: hash, salt: salt } }
  );

  await resetToken.markAsUsed();
  await SessionModel.deleteMany({ user_id: user._id });

  if (config.callbacks?.onPasswordReset) {
    await config.callbacks.onPasswordReset({ userId: user._id.toString(), email: user.email, ip: ctx.request.ip });
  }

  if (config.callbacks?.onAuthEvent) {
    await config.callbacks.onAuthEvent({ action: 'password_reset', userId: user._id.toString(), email: user.email, endpoint: '/reset-password', ip: ctx.request.ip });
  }

  return {
    status: 200,
    body: { message: 'Password reset successful' },
  };
}

async function handleDeleteAccount(ctx: BloomHandlerContext, config: BloomAuthConfig): Promise<GenericResponse> {
  if (!ctx.session?.userId) {
    return new APIError(APIErrorCode.NOT_AUTHENTICATED).toResponse();
  }

  const userId = ctx.session.userId;

  const user = await UserModel.findById(userId);
  if (!user) {
    return new APIError(APIErrorCode.USER_NOT_FOUND).toResponse();
  }

  if (config.callbacks?.onAccountDelete) {
    await config.callbacks.onAccountDelete({ userId, email: user.email, ip: ctx.request.ip });
  }

  if (config.callbacks?.onAuthEvent) {
    await config.callbacks.onAuthEvent({ action: 'account_delete', userId, email: user.email, endpoint: '/account', ip: ctx.request.ip });
  }

  await SessionModel.deleteMany({ user_id: userId });
  await Token.deleteMany({ user_id: userId });
  await UserCredentials.deleteOne({ user_id: userId });
  await UserModel.findByIdAndDelete(userId);

  return {
    status: 200,
    body: { message: 'Account deleted successfully' },
    clearSession: true,
  };
}

export { User, Session, BloomAuthConfig, BloomAuth } from './types';
