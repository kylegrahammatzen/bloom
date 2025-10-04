import { cookies, headers } from 'next/headers';
import { parseSessionCookie } from '@bloom/core/schemas/session';
import type { Session, User } from '@bloom/core';

export type ValidatedSession = {
  user: User;
  session: Session;
} | null;

/**
 * Get validated session (server-side only)
 * Validates session against database by calling /api/auth/session
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
    const url = baseUrl ? `${baseUrl}/api/auth/session` : `${protocol}://${host}/api/auth/session`;

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
      console.log(`[Session] Validation failed - ${latency}ms (status: ${response.status})`);
      return null;
    }

    const data = await response.json() as { user: User; session: Session };

    if (!data.user || !data.session) {
      console.log(`[Session] Invalid data returned - ${latency}ms`);
      return null;
    }

    console.log(`[Session] Validated successfully - ${latency}ms (userId: ${data.user.id})`);

    return {
      user: data.user,
      session: data.session,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`[Session] Validation error - ${latency}ms`, error);
    return null;
  }
}
