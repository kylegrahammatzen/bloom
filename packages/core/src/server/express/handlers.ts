import express, { Request, Response, NextFunction, Router } from 'express';
import type { BloomAuth, BloomHandlerContext } from '@/schemas';
import { parseSessionCookie } from '@/schemas/session';
import { APIError, APIErrorCode } from '@/schemas/errors';
import { logger } from '@/utils/logger';
import { getCookieName, getCookieOptions } from '@/utils/cookies';

export function toExpressHandler(auth: BloomAuth): Router {
  const router = express.Router();
  const cookieName = getCookieName(auth.config);
  const cookieOptions = getCookieOptions(auth.config);

  router.use(express.json({ limit: '10mb' }));
  router.use(express.urlencoded({ extended: true, limit: '10mb' }));

  router.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || req.socket.remoteAddress
        || req.ip;

      const userAgent = req.headers['user-agent'];
      const sessionCookie = req.cookies[cookieName];
      const session = sessionCookie ? parseSessionCookie(sessionCookie) ?? undefined : undefined;

      const context: BloomHandlerContext = {
        request: {
          method: req.method,
          path: req.path,
          url: req.url,
          body: req.body,
          headers: req.headers as Record<string, string | string[] | undefined>,
          ip,
          userAgent,
        },
        session,
      };

      const result = await auth.handler(context);

      if (result.sessionData) {
        res.cookie(cookieName, JSON.stringify(result.sessionData), cookieOptions);
      }

      if (result.clearSession) {
        res.clearCookie(cookieName);
      }

      res.status(result.status).json(result.body);
    } catch (error) {
      if (!(error instanceof APIError || error instanceof SyntaxError)) {
        logger.error({ error, path: req.path }, 'Auth API error');
      }

      const apiError = error instanceof APIError
        ? error
        : error instanceof SyntaxError
        ? new APIError(APIErrorCode.INVALID_REQUEST)
        : new APIError(APIErrorCode.INTERNAL_ERROR);

      const response = apiError.toResponse();
      res.status(response.status).json(response.body);
    }
  });

  return router;
}

export function requireAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cookieName = process.env.BLOOM_COOKIE_NAME || 'bloom.sid';
      const sessionCookie = req.cookies[cookieName];
      const session = sessionCookie ? parseSessionCookie(sessionCookie) : null;

      if (!session) {
        const response = new APIError(APIErrorCode.NOT_AUTHENTICATED).toResponse();
        return res.status(response.status).json(response.body);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
