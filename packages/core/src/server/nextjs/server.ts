import { cookies } from 'next/headers';
import { parseSessionCookie } from '@/schemas/session';
import { APIError, APIErrorCode } from '@/schemas/errors';

export type BloomSession = {
  userId: string;
  sessionId: string;
} | null;

/**
 * Get the current session data from cookies (server-side only)
 * Use this in Server Components, Server Actions, and Route Handlers
 * Note: This only reads the cookie, it does NOT validate the session with the database
 * For validated sessions, use the /api/auth/me endpoint from client components
 */
export async function getSession(cookieName: string = 'bloom.sid'): Promise<BloomSession> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(cookieName);

  if (!sessionCookie) {
    return null;
  }

  return parseSessionCookie(sessionCookie.value);
}


/**
 * Require authentication in Server Components
 * Throws APIError if not authenticated
 * Note: This only checks for session cookie presence, not validity
 */
export async function requireAuth(cookieName?: string): Promise<BloomSession> {
  const session = await getSession(cookieName);

  if (!session) {
    throw new APIError(APIErrorCode.NOT_AUTHENTICATED);
  }

  return session;
}
