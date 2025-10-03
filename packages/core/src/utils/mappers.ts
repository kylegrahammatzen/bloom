import type { User, Session } from '../types';
import type { IUser, ISession } from '../models';

export function mapUser(user: IUser): User {
  return {
    id: user._id.toString(),
    email: user.email,
    email_verified: user.email_verified,
    name: user.name,
    image: user.image,
    created_at: user.created_at,
    updated_at: user.updated_at,
    last_login: user.last_login,
  };
}

export function mapSession(session: ISession): Session {
  return {
    id: session.session_id,
    userId: session.user_id.toString(),
    expiresAt: session.expires_at,
    createdAt: session.created_at,
    lastAccessedAt: session.last_accessed,
    ipAddress: session.ip_address,
    userAgent: session.user_agent,
  };
}
