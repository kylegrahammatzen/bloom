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

async function parseRequestBody(request: NextRequest, method: string) {
  if (method === 'GET') return undefined;
  const text = await request.text();
  return text.trim() ? JSON.parse(text) : undefined;
}

function toAPIError(error: unknown): APIError {
  if (error instanceof APIError) return error;
  if (error instanceof SyntaxError) return new APIError(APIErrorCode.INVALID_REQUEST);
  return new APIError(APIErrorCode.INTERNAL_ERROR);
}

function buildContext(request: NextRequest, method: string, body: any, session: any): BloomHandlerContext {
  const pathname = request.nextUrl.pathname;
  return {
    request: {
      method,
      path: pathname.replace(API_AUTH_PREFIX, ''),
      url: pathname,
      body,
      headers: Object.fromEntries(request.headers.entries()),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    },
    session,
  };
}

export function createAuthHandler(config: NextAuthHandlerConfig) {
  const { auth, connectDB, cors: corsConfig } = config;
  const cookieName = getCookieName(auth.config);
  const cookieOptions = getCookieOptionsForNextJS(auth.config);

  // Pre-compute static CORS headers once at handler creation
  const staticCorsHeaders = corsConfig !== false ? {
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Cookie, Authorization',
    ...(corsConfig?.credentials !== false && { 'Access-Control-Allow-Credentials': 'true' })
  } : null;

  function applyCors(response: NextResponse, request: NextRequest) {
    if (!staticCorsHeaders) return;

    // Apply static headers
    Object.entries(staticCorsHeaders).forEach(([key, value]) => response.headers.set(key, value));

    // Handle dynamic origin per request
    const origin = request.headers.get('origin');
    const allowedOrigins = corsConfig !== false ? corsConfig?.origin : undefined;

    if (Array.isArray(allowedOrigins)) {
      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Vary', 'Origin');
      }
    } else if (allowedOrigins) {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigins);
    } else if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Vary', 'Origin');
    }
  }

  function createJsonResponse(request: NextRequest, body: any, status: number): NextResponse {
    const response = NextResponse.json(body, { status });
    applyCors(response, request);
    return response;
  }

  function handleSessionCookie(response: NextResponse, sessionData?: any, clearSession?: boolean) {
    if (sessionData) {
      response.cookies.set(cookieName, JSON.stringify(sessionData), cookieOptions);
    } else if (clearSession) {
      response.cookies.delete(cookieName);
    }
  }

  async function handleRequest(request: NextRequest, method: string) {
    try {
      await connectDB?.();

      const body = await parseRequestBody(request, method);
      const sessionCookie = request.cookies.get(cookieName);
      const session = sessionCookie ? parseSessionCookie(sessionCookie.value) : undefined;
      const context = buildContext(request, method, body, session);

      const result = await auth.handler(context);
      const response = createJsonResponse(request, result.body, result.status);

      handleSessionCookie(response, result.sessionData, result.clearSession);

      return response;
    } catch (error) {
      if (!(error instanceof APIError || error instanceof SyntaxError)) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Auth API error at ${request.nextUrl.pathname}: ${message}`);
      }

      const apiError = toAPIError(error);
      const errorResponse = apiError.toResponse();
      return createJsonResponse(request, errorResponse.body, errorResponse.status);
    }
  }

  function handleOptions(request: NextRequest) {
    const response = new NextResponse(null, { status: 204 });
    applyCors(response, request);
    return response;
  }

  return {
    GET: (request: NextRequest) => handleRequest(request, 'GET'),
    POST: (request: NextRequest) => handleRequest(request, 'POST'),
    DELETE: (request: NextRequest) => handleRequest(request, 'DELETE'),
    OPTIONS: handleOptions,
  };
}
