import { NextRequest, NextResponse } from 'next/server';
import type { BloomHandlerContext, BloomAuth } from '@bloom/core/types';

export type NextAuthHandlerConfig = {
  auth: BloomAuth;
  connectDB?: () => Promise<void>;
};

export function createAuthHandler(config: NextAuthHandlerConfig) {
  const { auth, connectDB } = config;

  async function handleRequest(request: NextRequest, method: string) {
    try {
      // Connect to database if needed
      if (connectDB) {
        await connectDB();
      }

      // Extract path from URL
      const pathname = request.nextUrl.pathname;
      const path = pathname.replace('/api/auth', '');

      // Get body for POST/DELETE requests
      let body = undefined;
      if (method !== 'GET') {
        try {
          body = await request.json();
        } catch {
          body = undefined;
        }
      }

      // Build Bloom context
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
        session: undefined,
      };

      // Call Bloom handler
      const result = await auth.handler(context);

      // Create response
      const response = NextResponse.json(result.body, {
        status: result.status,
      });

      // Handle session data (using cookies)
      if (result.sessionData) {
        response.cookies.set('bloom.session', JSON.stringify(result.sessionData), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60,
        });
      }

      // Clear session if requested
      if (result.clearSession) {
        response.cookies.delete('bloom.session');
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
