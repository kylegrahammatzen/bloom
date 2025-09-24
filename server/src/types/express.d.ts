import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      session: {
        userId?: string;
        sessionId?: string;
        destroy: (callback: (err?: any) => void) => void;
      } & import('express-session').SessionData;
    }
  }
}