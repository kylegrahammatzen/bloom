import { NextRequest, NextResponse } from 'next/server';
import type { BloomHandlerContext, BloomAuth } from '@/types';

export type NextAuthHandlerConfig = {
  auth: BloomAuth;
  connectDB?: () => Promise<void>;
};

const API_AUTH_PREFIX = '/api/auth';

function parseSessionCookie(cookieValue: string) {
  try {
    const data = JSON.parse(cookieValue);
    return { userId: data.userId, sessionId: data.sessionId };
  } catch {
    return undefined;
  }
}

export function createAuthHandler(config: NextAuthHandlerConfig) {
  const { auth, connectDB } = config;
  const cookieName = auth.config.session?.cookieName || 'bloom.sid';

  async function handleRequest(request: NextRequest, method: string) {
    try {
      await connectDB?.();

      const pathname = request.nextUrl.pathname;
      const path = pathname.replace(API_AUTH_PREFIX, '');

      const body = method !== 'GET' ? await request.json().catch(() => undefined) : undefined;

      const sessionCookie = request.cookies.get(cookieName);
      const session = sessionCookie ? parseSessionCookie(sessionCookie.value) : undefined;

      const context: BloomHandlerContext = {
        request: {
          method,
          path,
          url: pathname,
          body,
          headers: Object.fromEntries(request.headers.entries()),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
        session,
      };

      const result = await auth.handler(context);
      const response = NextResponse.json(result.body, { status: result.status });

      if (result.sessionData) {
        response.cookies.set(cookieName, JSON.stringify(result.sessionData), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60,
        });
      }

      if (result.clearSession) {
        response.cookies.delete(cookieName);
      }

      return response;
    } catch (error) {
      console.error('Auth API error:', error);
      return NextResponse.json(
        { error: { message: 'Internal server error' } },
        { status: 500 }
      );
    }
  }

  return {
    GET: (request: NextRequest) => handleRequest(request, 'GET'),
    POST: (request: NextRequest) => handleRequest(request, 'POST'),
    DELETE: (request: NextRequest) => handleRequest(request, 'DELETE'),
  };
}
