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
};
export declare function requireAuth(options?: RequireAuthOptions): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare function attachUser(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
