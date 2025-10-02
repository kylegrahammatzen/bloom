import type { User } from "./user";
export type SessionData = {
    id: string;
    userId: string;
    expiresAt: string;
    createdAt: string;
    lastAccessedAt: string;
    ipAddress?: string;
    userAgent?: string;
};
export type Session = {
    user: User;
    session: SessionData;
};
