import { cookies, headers } from 'next/headers';
import { parseSessionCookie } from '@bloom/core/schemas/session';
import type { Session, User } from '@bloom/core';
import { createLogger } from '@bloom/core';

const logger = createLogger();

export type ValidatedSession = {
  user: User;
  session: Session;
} | null;

/**
 * Get validated session (server-side only)
 * Validates session against database by calling /api/auth/me
 */
export async function getSession(cookieName: string = 'bloom.sid', baseUrl?: string): Promise<ValidatedSession> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(cookieName);

  if (!sessionCookie) {
    return null;
  }

  const session = parseSessionCookie(sessionCookie.value);
  if (!session) {
    return null;
  }

  const startTime = Date.now();

  try {
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const url = baseUrl ? `${baseUrl}/api/auth/me` : `${protocol}://${host}/api/auth/me`;

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
      },
      next: { revalidate: 0 },
    } as RequestInit);

    const latency = Date.now() - startTime;

    if (!response.ok) {
      logger.debug('Session validation failed', { latency, status: response.status });
      return null;
    }

    const data = await response.json() as { user: User; session: Session };

    if (!data.user || !data.session) {
      logger.debug('Invalid session data returned', { latency });
      return null;
    }

    logger.debug('Session validated successfully', { latency, userId: data.user.id });

    return {
      user: data.user,
      session: data.session,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    logger.error('Session validation error', { latency, error });
    return null;
  }
}
