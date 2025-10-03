import { describe, it, expect } from 'vitest';
import { APIResponse, createSuccess } from '../../src/utils/response';

describe('response utils', () => {
  describe('APIResponse.success', () => {
    it('should create success response without session data', () => {
      const body = { message: 'Success' };
      const response = APIResponse.success(body);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(body);
      expect(response.sessionData).toBeUndefined();
    });

    it('should create success response with session data', () => {
      const body = { message: 'Success' };
      const sessionData = { userId: 'user123', sessionId: 'session123' };
      const response = APIResponse.success(body, sessionData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(body);
      expect(response.sessionData).toEqual(sessionData);
    });
  });

  describe('APIResponse.created', () => {
    it('should create created response without session data', () => {
      const body = { message: 'Created' };
      const response = APIResponse.created(body);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(body);
      expect(response.sessionData).toBeUndefined();
    });

    it('should create created response with session data', () => {
      const body = { message: 'Created' };
      const sessionData = { userId: 'user123', sessionId: 'session123' };
      const response = APIResponse.created(body, sessionData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(body);
      expect(response.sessionData).toEqual(sessionData);
    });
  });

  describe('APIResponse.logout', () => {
    it('should create logout response with default message', () => {
      const response = APIResponse.logout();

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Logout successful' });
      expect(response.clearSession).toBe(true);
    });

    it('should create logout response with custom message', () => {
      const message = 'Custom logout message';
      const response = APIResponse.logout(message);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message });
      expect(response.clearSession).toBe(true);
    });
  });

  describe('createSuccess', () => {
    it('should create custom success response', () => {
      const body = { data: 'test' };
      const response = createSuccess(200, body);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(body);
      expect(response.sessionData).toBeUndefined();
      expect(response.clearSession).toBeUndefined();
    });

    it('should create response with session data', () => {
      const body = { data: 'test' };
      const sessionData = { userId: 'user123', sessionId: 'session123' };
      const response = createSuccess(200, body, sessionData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(body);
      expect(response.sessionData).toEqual(sessionData);
    });

    it('should create response with clearSession flag', () => {
      const body = { data: 'test' };
      const response = createSuccess(200, body, undefined, true);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(body);
      expect(response.clearSession).toBe(true);
    });

    it('should create response with both session data and clearSession', () => {
      const body = { data: 'test' };
      const sessionData = { userId: 'user123', sessionId: 'session123' };
      const response = createSuccess(200, body, sessionData, true);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(body);
      expect(response.sessionData).toEqual(sessionData);
      expect(response.clearSession).toBe(true);
    });
  });
});
