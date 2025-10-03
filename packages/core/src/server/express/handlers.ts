import express, { Request, Response, NextFunction, Router } from 'express';
import type { BloomAuth, BloomHandlerContext } from '@/types';
import './types';

export function toExpressHandler(auth: BloomAuth): Router {
  const router = express.Router();

  router.use(express.json({ limit: '10mb' }));
  router.use(express.urlencoded({ extended: true, limit: '10mb' }));

  router.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || req.socket.remoteAddress
        || req.ip;

      const userAgent = req.headers['user-agent'];

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
        session: req.session && {
          userId: req.session.userId,
          sessionId: req.session.sessionId,
        },
      };

      const result = await auth.handler(context);

      if (result.sessionData && req.session) {
        req.session.userId = result.sessionData.userId;
        req.session.sessionId = result.sessionData.sessionId;
      }

      if (result.clearSession && req.session) {
        req.session.destroy((err) => {
          if (err) console.error('Session destruction error:', err);
        });
        res.clearCookie(auth.config.session?.cookieName || 'bloom.sid');
      }

      res.status(result.status).json(result.body);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export function requireAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          error: {
            message: 'Authentication required',
          },
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
