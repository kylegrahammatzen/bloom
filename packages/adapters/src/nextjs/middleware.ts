import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export type BloomMiddlewareConfig = {
  protectedRoutes?: string[];
  afterAuth?: (request: NextRequest, session: any) => NextResponse | Promise<NextResponse>;
};

export function bloomMiddleware(config: BloomMiddlewareConfig = {}) {
  return async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Always allow API routes to handle themselves
    if (pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    // Get session from cookie
    const sessionCookie = request.cookies.get('bloom.session');
    const session = sessionCookie ? JSON.parse(sessionCookie.value) : null;

    // Check if route is protected
    const isProtectedRoute = config.protectedRoutes?.some(route =>
      pathname === route || pathname.startsWith(route + '/')
    );

    // Redirect to home if accessing protected route without session
    if (isProtectedRoute && !session) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // Allow custom afterAuth logic
    if (config.afterAuth) {
      return config.afterAuth(request, session);
    }

    return NextResponse.next();
  };
}
