import type { BloomAuthConfig, BloomHandlerContext, GenericResponse } from '@/schemas';
import { APIError, APIErrorCode } from '@/schemas/errors';
import { handleRegister } from '@/api/routes/register';
import { handleLogin } from '@/api/routes/login';
import { handleLogout } from '@/api/routes/logout';
import { handleGetSession, handleGetAllSessions, handleRevokeSession } from '@/api/routes/session';
import { handleVerifyEmail, handleRequestEmailVerification } from '@/api/routes/email';
import { handleRequestPasswordReset, handleResetPassword } from '@/api/routes/password';
import { handleDeleteAccount } from '@/api/routes/account';

type RouteHandler = (ctx: BloomHandlerContext, config: BloomAuthConfig) => Promise<GenericResponse>;

const routes: Record<string, Record<string, RouteHandler>> = {
  POST: {
    '/register': handleRegister,
    '/login': handleLogin,
    '/logout': handleLogout,
    '/verify-email': handleVerifyEmail,
    '/request-email-verification': handleRequestEmailVerification,
    '/request-password-reset': handleRequestPasswordReset,
    '/reset-password': handleResetPassword,
    '/sessions/revoke': handleRevokeSession,
  },
  GET: {
    '/me': handleGetSession,
    '/sessions': handleGetAllSessions,
    '/verify-email': handleVerifyEmail,
  },
  DELETE: {
    '/account': handleDeleteAccount,
  },
};

export function createHandler(config: BloomAuthConfig) {
  return async (ctx: BloomHandlerContext): Promise<GenericResponse> => {
    const method = ctx.request.method;
    const path = ctx.request.path || ctx.request.url || '';
    const normalizedPath = path.replace(/^\/api\/auth/, '').replace(/\/$/, '') || '/';

    try {
      const handler = routes[method]?.[normalizedPath];

      if (!handler) {
        return new APIError(APIErrorCode.ENDPOINT_NOT_FOUND).toResponse();
      }

      return await handler(ctx, config);
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
