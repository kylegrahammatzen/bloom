import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export type BloomMiddlewareConfig = {
  publicRoutes?: string[];
  protectedRoutes?: string[];
  apiRoutePrefix?: string;
  afterAuth?: (request: NextRequest, session: any) => NextResponse | Promise<NextResponse>;
};

export function bloomMiddleware(config: BloomMiddlewareConfig = {}) {
  const {
    publicRoutes = ['/'],
    protectedRoutes = [],
    apiRoutePrefix = '/api/auth',
    afterAuth,
  } = config;

  return async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Always allow API routes to handle themselves
    if (pathname.startsWith(apiRoutePrefix)) {
      return NextResponse.next();
    }

    // Get session from cookie
    const sessionCookie = request.cookies.get('bloom.session');
    const session = sessionCookie ? JSON.parse(sessionCookie.value) : null;

    // Check if route is protected
    const isProtectedRoute = protectedRoutes.some(route =>
      pathname === route || pathname.startsWith(route + '/')
    );

    const isPublicRoute = publicRoutes.some(route =>
      pathname === route || pathname.startsWith(route + '/')
    );

    // Redirect to login if accessing protected route without session
    if (isProtectedRoute && !session) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Redirect to home if accessing public route with session
    if (isPublicRoute && session && (pathname === '/login' || pathname === '/signup')) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // Allow custom afterAuth logic
    if (afterAuth) {
      return afterAuth(request, session);
    }

    return NextResponse.next();
  };
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
