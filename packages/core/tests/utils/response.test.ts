import { describe, it, expect } from 'vitest';
import { json } from '../../src/utils/response';

describe('response utils', () => {
  describe('json', () => {
    it('should create success response without options', () => {
      const body = { message: 'Success' };
      const response = json(body);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(body);
      expect(response.sessionData).toBeUndefined();
      expect(response.clearSession).toBeUndefined();
    });

    it('should create success response with custom status', () => {
      const body = { message: 'Created' };
      const response = json(body, { status: 201 });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(body);
    });

    it('should create response with session data', () => {
      const body = { message: 'Success' };
      const sessionData = { userId: 'user123', sessionId: 'session123' };
      const response = json(body, { sessionData });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(body);
      expect(response.sessionData).toEqual(sessionData);
    });

    it('should create response with clearSession flag', () => {
      const body = { message: 'Logout successful' };
      const response = json(body, { clearSession: true });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(body);
      expect(response.clearSession).toBe(true);
    });

    it('should create response with status, session data, and clearSession', () => {
      const body = { message: 'Test' };
      const sessionData = { userId: 'user123', sessionId: 'session123' };
      const response = json(body, {
        status: 201,
        sessionData,
        clearSession: true
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(body);
      expect(response.sessionData).toEqual(sessionData);
      expect(response.clearSession).toBe(true);
    });

    it('should validate response with GenericResponseSchema', () => {
      const body = { user: { id: '123', email: 'test@example.com' } };

      expect(() => json(body)).not.toThrow();
    });

    it('should default to status 200 when not provided', () => {
      const response = json({ data: 'test' });
      expect(response.status).toBe(200);
    });

    it('should handle empty body object', () => {
      const response = json({});
      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });

    it('should handle complex nested objects', () => {
      const body = {
        user: {
          id: '123',
          profile: {
            name: 'Test User',
            settings: {
              theme: 'dark'
            }
          }
        }
      };
      const response = json(body);
      expect(response.body).toEqual(body);
    });
  });
});
