import type { Request, Response, NextFunction, Router } from 'express';
import type { BloomAuth, BloomHandlerContext } from '@bloom/core';
import express from 'express';

export function toExpressHandler(auth: BloomAuth): Router {
  const router = express.Router();

  // Add body parsing middleware for auth routes
  router.use(express.json({ limit: '10mb' }));
  router.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Main handler for all auth routes
  router.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract IP address (handle proxies)
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || req.socket.remoteAddress
        || req.ip;

      // Extract user agent
      const userAgent = req.headers['user-agent'];

      // Build framework-agnostic context
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

      // Call core auth handler
      const result = await auth.handler(context);

      // Handle session data
      if (result.sessionData && req.session) {
        req.session.userId = result.sessionData.userId;
        req.session.sessionId = result.sessionData.sessionId;
      }

      // Clear session if requested
      if (result.clearSession && req.session) {
        req.session.destroy((err) => {
          if (err) console.error('Session destruction error:', err);
        });
        res.clearCookie(auth.config.session?.cookieName || 'bloom.sid');
      }

      // Send response
      res.status(result.status).json(result.body);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export function createExpressHandler(auth: BloomAuth) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || req.socket.remoteAddress
        || req.ip;

      const context: BloomHandlerContext = {
        request: {
          method: req.method,
          path: req.path,
          url: req.url,
          body: req.body,
          headers: req.headers as Record<string, string | string[] | undefined>,
          ip,
          userAgent: req.headers['user-agent'],
        },
        session: req.session && {
          userId: req.session.userId,
          sessionId: req.session.sessionId,
        },
      };

      const result = await auth.handler(context);

      if (result && typeof result === 'object' && 'status' in result) {
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
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  };
}
