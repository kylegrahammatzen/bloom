import { cookies } from 'next/headers';
import type { Session, User } from '@/types';

export type BloomSession = {
  session: Session | null;
  user: User | null;
  isSignedIn: boolean;
};

/**
 * Get the current session from cookies (server-side only)
 * Use this in Server Components, Server Actions, and Route Handlers
 * Validates session with the backend API
 */
export async function getSession(): Promise<BloomSession> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('bloom.session');

  if (!sessionCookie) {
    return {
      session: null,
      user: null,
      isSignedIn: false,
    };
  }

  try {
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error('NEXT_PUBLIC_APP_URL environment variable is required');
    }

    // Validate session with backend API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': `bloom.session=${sessionCookie.value}`,
      },
    } as RequestInit & { next?: { revalidate: number } });

    if (!response.ok) {
      return {
        session: null,
        user: null,
        isSignedIn: false,
      };
    }

    const validatedSession = await response.json() as { session?: Session; user?: User };

    return {
      session: validatedSession.session || null,
      user: validatedSession.user || null,
      isSignedIn: !!validatedSession.session,
    };
  } catch {
    return {
      session: null,
      user: null,
      isSignedIn: false,
    };
  }
}


/**
 * Require authentication in Server Components
 * Throws error if not authenticated
 */
export async function requireAuth(): Promise<BloomSession> {
  const session = await getSession();

  if (!session.isSignedIn) {
    throw new Error('Authentication required');
  }

  return session;
}
