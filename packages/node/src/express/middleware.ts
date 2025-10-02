import type { Request, Response, NextFunction } from 'express';
import type { User, Session } from '@bloom/core';
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    sessionId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
      bloomSession?: Session;
    }
  }
}

export type RequireAuthOptions = {
  redirectTo?: string;
  onUnauthorized?: (req: Request, res: Response) => void;
}

export function requireAuth(options: RequireAuthOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session || !req.session.userId) {
        if (options.onUnauthorized) {
          return options.onUnauthorized(req, res);
        }

        if (options.redirectTo) {
          return res.redirect(options.redirectTo);
        }

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

export function attachUser() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.session && req.session.userId) {

      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
