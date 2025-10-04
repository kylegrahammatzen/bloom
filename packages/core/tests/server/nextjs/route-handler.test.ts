import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createAuthHandler } from '../../../src/server/nextjs/route-handler';
import type { BloomAuth } from '../../../src/schemas';

const mockSetCookie = vi.fn();
const mockDeleteCookie = vi.fn();
const mockHeadersSet = vi.fn();

vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: vi.fn((body: any, init?: any) => {
        return {
          body,
          status: init?.status || 200,
          headers: {
            set: mockHeadersSet,
          },
          cookies: {
            set: mockSetCookie,
            delete: mockDeleteCookie,
          },
        };
      }),
    },
  };
});

describe('Next.js route handler', () => {
  let mockAuth: BloomAuth;
  let mockConnectDB: () => Promise<void>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetCookie.mockClear();
    mockDeleteCookie.mockClear();
    mockHeadersSet.mockClear();

    mockAuth = {
      handler: vi.fn(),
      config: {
        session: { cookieName: 'test.sid' },
      },
    } as any;

    mockConnectDB = vi.fn();
  });

  describe('createAuthHandler', () => {
    /**
     * Verify that createAuthHandler returns an object with GET, POST, and DELETE methods
     */
    it('should create handler with GET, POST, DELETE methods', () => {
      const handler = createAuthHandler({ auth: mockAuth });

      expect(handler).toHaveProperty('GET');
      expect(handler).toHaveProperty('POST');
      expect(handler).toHaveProperty('DELETE');
      expect(typeof handler.GET).toBe('function');
      expect(typeof handler.POST).toBe('function');
      expect(typeof handler.DELETE).toBe('function');
    });

    /**
     * Verify that the optional connectDB callback is called before handling requests
     */
    it('should connect to database if connectDB is provided', async () => {
      const handler = createAuthHandler({ auth: mockAuth, connectDB: mockConnectDB });

      mockAuth.handler = vi.fn().mockResolvedValue({
        status: 200,
        body: { message: 'Success' },
      });

      const request = new NextRequest('http://localhost/api/auth/me', {
        method: 'GET',
      });

      await handler.GET(request);

      expect(mockConnectDB).toHaveBeenCalled();
    });

    /**
     * Verify that session cookies are correctly parsed and passed to the auth handler
     */
    it('should parse session cookie from request', async () => {
      const handler = createAuthHandler({ auth: mockAuth });
      const sessionData = { userId: 'user123', sessionId: 'session123' };

      mockAuth.handler = vi.fn().mockResolvedValue({
        status: 200,
        body: { user: { id: 'user123' } },
      });

      const request = new NextRequest('http://localhost/api/auth/me', {
        method: 'GET',
        headers: {
          cookie: `test.sid=${JSON.stringify(sessionData)}`,
        },
      });

      await handler.GET(request);

      expect(mockAuth.handler).toHaveBeenCalledWith(
        expect.objectContaining({
          session: sessionData,
        })
      );
    });

    /**
     * Verify that requests without session cookies are handled correctly
     */
    it('should handle request without session cookie', async () => {
      const handler = createAuthHandler({ auth: mockAuth });

      mockAuth.handler = vi.fn().mockResolvedValue({
        status: 200,
        body: { message: 'Success' },
      });

      const request = new NextRequest('http://localhost/api/auth/me', {
        method: 'GET',
      });

      await handler.GET(request);

      expect(mockAuth.handler).toHaveBeenCalledWith(
        expect.objectContaining({
          session: undefined,
        })
      );
    });

    /**
     * Verify that session cookies are set when sessionData is returned
     */
    it('should set session cookie when sessionData is returned', async () => {
      const handler = createAuthHandler({ auth: mockAuth });
      const sessionData = { userId: 'user123', sessionId: 'session123' };

      mockAuth.handler = vi.fn().mockResolvedValue({
        status: 201,
        body: { message: 'Created' },
        sessionData,
      });

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'Password123!' }),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await handler.POST(request) as any;

      expect(mockSetCookie).toHaveBeenCalledWith(
        'test.sid',
        JSON.stringify(sessionData),
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
        })
      );
    });

    /**
     * Verify that session cookies are deleted when clearSession flag is set
     */
    it('should delete session cookie when clearSession is true', async () => {
      const handler = createAuthHandler({ auth: mockAuth });

      mockAuth.handler = vi.fn().mockResolvedValue({
        status: 200,
        body: { message: 'Logged out' },
        clearSession: true,
      });

      const request = new NextRequest('http://localhost/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await handler.POST(request) as any;

      expect(mockDeleteCookie).toHaveBeenCalledWith('test.sid');
    });

    /**
     * Verify that errors are caught and converted to 500 responses
     */
    it('should handle errors gracefully', async () => {
      const handler = createAuthHandler({ auth: mockAuth });

      mockAuth.handler = vi.fn().mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost/api/auth/me', {
        method: 'GET',
      });

      const response = await handler.GET(request) as any;

      expect(response.status).toBe(500);
      expect(response.body.error.message).toBe('Internal server error');
    });

    /**
     * Verify that JSON request bodies are correctly parsed for POST requests
     */
    it('should parse request body for POST requests', async () => {
      const handler = createAuthHandler({ auth: mockAuth });
      const requestBody = { email: 'test@example.com', password: 'Password123!' };

      mockAuth.handler = vi.fn().mockResolvedValue({
        status: 200,
        body: { message: 'Success' },
      });

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json',
        },
      });

      await handler.POST(request);

      expect(mockAuth.handler).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            body: requestBody,
          }),
        })
      );
    });

    /**
     * Verify that client IP addresses are extracted from x-forwarded-for header
     */
    it('should extract IP from headers', async () => {
      const handler = createAuthHandler({ auth: mockAuth });

      mockAuth.handler = vi.fn().mockResolvedValue({
        status: 200,
        body: { message: 'Success' },
      });

      const request = new NextRequest('http://localhost/api/auth/me', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });

      await handler.GET(request);

      expect(mockAuth.handler).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            ip: '192.168.1.1',
          }),
        })
      );
    });

    /**
     * Verify that default cookie name 'bloom.sid' is used when not configured
     */
    it('should use default cookie name if not configured', async () => {
      const authWithoutConfig = {
        handler: vi.fn().mockResolvedValue({
          status: 200,
          body: { message: 'Success' },
          sessionData: { userId: 'user123', sessionId: 'session123' },
        }),
        config: {},
      } as any;

      const handler = createAuthHandler({ auth: authWithoutConfig });

      const request = new NextRequest('http://localhost/api/auth/me', {
        method: 'GET',
      });

      const response = await handler.GET(request) as any;

      expect(response.cookies.set).toHaveBeenCalledWith(
        'bloom.sid',
        expect.any(String),
        expect.any(Object)
      );
    });
  });
});
