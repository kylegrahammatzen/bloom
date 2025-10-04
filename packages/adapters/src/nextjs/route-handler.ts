import { NextRequest, NextResponse } from 'next/server';
import type { BloomHandlerContext, BloomAuth } from '@bloom/core';
import { parseSessionCookie } from '@bloom/core/schemas/session';
import { APIError, APIErrorCode } from '@bloom/core/schemas/errors';
import { getCookieName, getCookieOptionsForNextJS } from '@bloom/core';

export type NextAuthHandlerConfig = {
  auth: BloomAuth;
  connectDB?: () => Promise<void>;
  cors?: {
    origin?: string | string[];
    credentials?: boolean;
  } | false;
};

const API_AUTH_PREFIX = '/api/auth';

function setCorsHeaders(response: NextResponse, request: NextRequest, corsConfig?: NextAuthHandlerConfig['cors']) {
  if (corsConfig === false) return;

  const origin = request.headers.get('origin');
  const allowedOrigins = corsConfig?.origin;

  if (allowedOrigins) {
    if (Array.isArray(allowedOrigins)) {
      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Vary', 'Origin');
      }
    } else {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigins);
    }
  } else if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
  }

  if (corsConfig?.credentials !== false) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Cookie, Authorization');
}

export function createAuthHandler(config: NextAuthHandlerConfig) {
  const { auth, connectDB, cors: corsConfig } = config;
  const cookieName = getCookieName(auth.config);
  const cookieOptions = getCookieOptionsForNextJS(auth.config);

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

      setCorsHeaders(response, request, corsConfig);

      if (result.sessionData) {
        response.cookies.set(
          cookieName,
          JSON.stringify(result.sessionData),
          cookieOptions
        );
      }

      if (result.clearSession) {
        response.cookies.delete(cookieName);
      }

      return response;
    } catch (error) {
      if (!(error instanceof APIError || error instanceof SyntaxError)) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Auth API error at ${request.nextUrl.pathname}: ${message}`);
      }

      const apiError = error instanceof APIError
        ? error
        : error instanceof SyntaxError
        ? new APIError(APIErrorCode.INVALID_REQUEST)
        : new APIError(APIErrorCode.INTERNAL_ERROR);

      const errorResponse = apiError.toResponse();
      const response = NextResponse.json(errorResponse.body, { status: errorResponse.status });
      setCorsHeaders(response, request, corsConfig);
      return response;
    }
  }

  async function handleOptions(request: NextRequest) {
    const response = new NextResponse(null, { status: 204 });
    setCorsHeaders(response, request, corsConfig);
    return response;
  }

  return {
    GET: (request: NextRequest) => handleRequest(request, 'GET'),
    POST: (request: NextRequest) => handleRequest(request, 'POST'),
    DELETE: (request: NextRequest) => handleRequest(request, 'DELETE'),
    OPTIONS: handleOptions,
  };
}
