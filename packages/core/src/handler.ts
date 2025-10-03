import type { BloomAuthConfig, BloomHandlerContext, GenericResponse } from '@/types';
import { createRouter, addRoute, findRoute } from '@/utils/router';
import { APIError, APIErrorCode } from '@/types/errors';
import { handleRegister } from '@/api/routes/register';
import { handleLogin } from '@/api/routes/login';
import { handleLogout } from '@/api/routes/logout';
import { handleGetSession } from '@/api/routes/session';
import { handleVerifyEmail } from '@/api/routes/email';
import { handleRequestPasswordReset, handleResetPassword } from '@/api/routes/password';
import { handleDeleteAccount } from '@/api/routes/account';

export function createHandler(config: BloomAuthConfig) {
  const router = createRouter();

  addRoute(router, 'POST', '/register', (ctx: BloomHandlerContext) => handleRegister(ctx, config));
  addRoute(router, 'POST', '/login', (ctx: BloomHandlerContext) => handleLogin(ctx, config));
  addRoute(router, 'POST', '/logout', (ctx: BloomHandlerContext) => handleLogout(ctx, config));
  addRoute(router, 'GET', '/me', handleGetSession);
  addRoute(router, 'POST', '/verify-email', (ctx: BloomHandlerContext) => handleVerifyEmail(ctx, config));
  addRoute(router, 'POST', '/request-password-reset', (ctx: BloomHandlerContext) => handleRequestPasswordReset(ctx, config));
  addRoute(router, 'POST', '/reset-password', (ctx: BloomHandlerContext) => handleResetPassword(ctx, config));
  addRoute(router, 'DELETE', '/account', (ctx: BloomHandlerContext) => handleDeleteAccount(ctx, config));

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
