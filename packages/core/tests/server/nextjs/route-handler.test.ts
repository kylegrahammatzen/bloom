import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createAuthHandler } from '../../../src/server/nextjs/route-handler';
import type { BloomAuth } from '../../../src/types';

// Mock NextResponse
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: vi.fn((body: any, init?: any) => ({
        body,
        status: init?.status || 200,
        cookies: {
          set: vi.fn(),
          delete: vi.fn(),
        },
      })),
    },
  };
});

describe('Next.js route handler', () => {
  let mockAuth: BloomAuth;
  let mockConnectDB: () => Promise<void>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuth = {
      handler: vi.fn(),
      config: {
        session: { cookieName: 'test.sid' },
      },
    } as any;

    mockConnectDB = vi.fn();
  });

  describe('createAuthHandler', () => {
    it('should create handler with GET, POST, DELETE methods', () => {
      const handler = createAuthHandler({ auth: mockAuth });

      expect(handler).toHaveProperty('GET');
      expect(handler).toHaveProperty('POST');
      expect(handler).toHaveProperty('DELETE');
      expect(typeof handler.GET).toBe('function');
      expect(typeof handler.POST).toBe('function');
      expect(typeof handler.DELETE).toBe('function');
    });

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

    it('should handle request without session cookie', async () => {
      const handler = createAuthHandler({ auth: mockAuth });

      mockAuth.handler = vi.fn().mockResolvedValue({
        status: 200,
        body: { message: 'Success' },
      });

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
      });

      await handler.POST(request);

      expect(mockAuth.handler).toHaveBeenCalledWith(
        expect.objectContaining({
          session: undefined,
        })
      );
    });

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
      });

      const response = await handler.POST(request) as any;

      expect(response.cookies.set).toHaveBeenCalledWith(
        'test.sid',
        JSON.stringify(sessionData),
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
        })
      );
    });

    it('should delete session cookie when clearSession is true', async () => {
      const handler = createAuthHandler({ auth: mockAuth });

      mockAuth.handler = vi.fn().mockResolvedValue({
        status: 200,
        body: { message: 'Logged out' },
        clearSession: true,
      });

      const request = new NextRequest('http://localhost/api/auth/logout', {
        method: 'DELETE',
      });

      const response = await handler.DELETE(request) as any;

      expect(response.cookies.delete).toHaveBeenCalledWith('test.sid');
    });

    it('should handle errors gracefully', async () => {
      const handler = createAuthHandler({ auth: mockAuth });

      mockAuth.handler = vi.fn().mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/auth/me', {
        method: 'GET',
      });

      const response = await handler.GET(request) as any;

      expect(response.status).toBe(500);
      expect(response.body.error.message).toBe('Internal server error');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

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
