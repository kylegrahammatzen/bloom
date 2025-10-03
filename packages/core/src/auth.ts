import type { BloomAuthConfig, BloomAuth, BloomHandlerContext, GenericResponse } from './types';
import { User as UserModel, Session as SessionModel } from './models';
import { createRouter, addRoute, findRoute } from './utils/router';
import { APIError, APIErrorCode } from './types/errors';
import { handleRegister } from './api/routes/register';
import { handleLogin } from './api/routes/login';
import { handleLogout } from './api/routes/logout';
import { handleGetSession } from './api/routes/session';
import { handleVerifyEmail } from './api/routes/email';
import { handleRequestPasswordReset, handleResetPassword } from './api/routes/password';
import { handleDeleteAccount } from './api/routes/account';

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

export { User, Session, BloomAuthConfig, BloomAuth } from './types';
