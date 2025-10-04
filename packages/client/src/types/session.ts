import type { User } from "./user";

export type SessionData = {
	id: string;
	userId: string;
	expiresAt: string;
	createdAt: string;
	lastAccessedAt: string;
	ipAddress?: string;
	userAgent?: string;
	browser?: string;
	os?: string;
	deviceType?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
	isCurrent?: boolean;
};

export type Session = {
	user: User;
	session: SessionData;
};
