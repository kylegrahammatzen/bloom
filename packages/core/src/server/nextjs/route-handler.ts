import { NextRequest, NextResponse } from 'next/server';
import type { BloomHandlerContext, BloomAuth } from '@/types';
import { parseSessionCookie } from '@/types/session';
import { APIError, APIErrorCode } from '@/types/errors';

export type NextAuthHandlerConfig = {
  auth: BloomAuth;
  connectDB?: () => Promise<void>;
};

const API_AUTH_PREFIX = '/api/auth';

export function createAuthHandler(config: NextAuthHandlerConfig) {
  const { auth, connectDB } = config;
  const cookieName = auth.config.session?.cookieName || 'bloom.sid';

  async function handleRequest(request: NextRequest, method: string) {
    try {
      await connectDB?.();

      const pathname = request.nextUrl.pathname;
      const path = pathname.replace(API_AUTH_PREFIX, '');

      let body: any = undefined;
      if (method !== 'GET') {
        try {
          body = await request.json();
        } catch (error) {
          if (error instanceof SyntaxError) {
            throw error;
          }
          body = undefined;
        }
      }

      const sessionCookie = request.cookies.get(cookieName);
      const session = sessionCookie ? parseSessionCookie(sessionCookie.value) ?? undefined : undefined;

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
      if (!(error instanceof APIError || error instanceof SyntaxError)) {
        console.error('Auth API error:', error);
      }

      const apiError = error instanceof APIError
        ? error
        : error instanceof SyntaxError
        ? new APIError(APIErrorCode.INVALID_REQUEST)
        : new APIError(APIErrorCode.INTERNAL_ERROR);

      const response = apiError.toResponse();
      return NextResponse.json(response.body, { status: response.status });
    }
  }

  return {
    GET: (request: NextRequest) => handleRequest(request, 'GET'),
    POST: (request: NextRequest) => handleRequest(request, 'POST'),
    DELETE: (request: NextRequest) => handleRequest(request, 'DELETE'),
  };
}
