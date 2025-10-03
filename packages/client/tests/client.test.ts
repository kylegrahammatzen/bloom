import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBloomClient } from '@/client';

// Mock the global fetch
global.fetch = vi.fn();

describe('BloomClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signUp', () => {
    it('should make POST request to /api/auth/register', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ user: { id: '123', email: 'test@example.com' } }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const client = createBloomClient();
      await client.signUp({ email: 'test@example.com', password: 'Password123!' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'Password123!' }),
        })
      );
    });

    it('should return success response', async () => {
      const mockData = { user: { id: '123', email: 'test@example.com' } };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const client = createBloomClient();
      const result = await client.signUp({ email: 'test@example.com', password: 'Password123!' });

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeUndefined();
    });

    it('should return error response on failure', async () => {
      const mockError = { error: { code: 'INVALID_EMAIL', message: 'Invalid email' } };
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue(mockError),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const client = createBloomClient();
      const result = await client.signUp({ email: 'invalid', password: 'Password123!' });

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Invalid email');
    });
  });

  describe('signIn', () => {
    it('should make POST request to /api/auth/login', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ user: { id: '123', email: 'test@example.com' } }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const client = createBloomClient();
      await client.signIn({ email: 'test@example.com', password: 'Password123!' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'Password123!' }),
        })
      );
    });

    it('should return session data on success', async () => {
      const mockData = { user: { id: '123', email: 'test@example.com' } };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const client = createBloomClient();
      const result = await client.signIn({ email: 'test@example.com', password: 'Password123!' });

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeUndefined();
    });
  });

  describe('signOut', () => {
    it('should make POST request to /api/auth/logout', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ message: 'Logged out' }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const client = createBloomClient();
      await client.signOut();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/logout',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should return success message', async () => {
      const mockData = { message: 'Logged out' };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const client = createBloomClient();
      const result = await client.signOut();

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeUndefined();
    });
  });

  describe('deleteAccount', () => {
    it('should make DELETE request to /api/auth/account', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ message: 'Account deleted' }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const client = createBloomClient();
      await client.deleteAccount();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/account',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('getSession', () => {
    it('should make GET request to /api/auth/me', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ user: { id: '123', email: 'test@example.com' } }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const client = createBloomClient();
      await client.getSession();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/me',
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    it('should return session data', async () => {
      const mockData = { user: { id: '123', email: 'test@example.com' } };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const client = createBloomClient();
      const result = await client.getSession();

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeUndefined();
    });

    it('should return error on unauthorized', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: vi.fn().mockResolvedValue({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const client = createBloomClient();
      const result = await client.getSession();

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Not authenticated');
    });
  });

  describe('client configuration', () => {
    it('should use custom baseUrl from config', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ user: { id: '123' } }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const client = createBloomClient({ baseUrl: 'https://api.example.com' });
      await client.getSession();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/auth/me',
        expect.any(Object)
      );
    });
  });
});
