import { describe, it, expect } from 'vitest';
import { isValidSessionData, parseSessionCookie, type SessionCookieData } from '../../src/schemas/session';

describe('Session Type Validation', () => {
  describe('isValidSessionData', () => {
    it('should return true for valid session data', () => {
      const validData = { userId: 'user123', sessionId: 'session456' };
      expect(isValidSessionData(validData)).toBe(true);
    });

    it('should return false for missing userId', () => {
      const invalidData = { sessionId: 'session456' };
      expect(isValidSessionData(invalidData)).toBe(false);
    });

    it('should return false for missing sessionId', () => {
      const invalidData = { userId: 'user123' };
      expect(isValidSessionData(invalidData)).toBe(false);
    });

    it('should return false for non-string userId', () => {
      const invalidData = { userId: 123, sessionId: 'session456' };
      expect(isValidSessionData(invalidData)).toBe(false);
    });

    it('should return false for non-string sessionId', () => {
      const invalidData = { userId: 'user123', sessionId: 456 };
      expect(isValidSessionData(invalidData)).toBe(false);
    });

    it('should return false for empty userId', () => {
      const invalidData = { userId: '', sessionId: 'session456' };
      expect(isValidSessionData(invalidData)).toBe(false);
    });

    it('should return false for empty sessionId', () => {
      const invalidData = { userId: 'user123', sessionId: '' };
      expect(isValidSessionData(invalidData)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isValidSessionData(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidSessionData(undefined)).toBe(false);
    });

    it('should return false for non-object types', () => {
      expect(isValidSessionData('string')).toBe(false);
      expect(isValidSessionData(123)).toBe(false);
      expect(isValidSessionData(true)).toBe(false);
      expect(isValidSessionData([])).toBe(false);
    });

    it('should return false for object with extra properties only', () => {
      const invalidData = { foo: 'bar', baz: 'qux' };
      expect(isValidSessionData(invalidData)).toBe(false);
    });

    it('should return true for object with extra properties and valid session data', () => {
      const validData = { userId: 'user123', sessionId: 'session456', extra: 'ignored' };
      expect(isValidSessionData(validData)).toBe(true);
    });
  });

  describe('parseSessionCookie', () => {
    it('should parse valid JSON with valid session data', () => {
      const cookieValue = JSON.stringify({ userId: 'user123', sessionId: 'session456' });
      const result = parseSessionCookie(cookieValue);

      expect(result).toEqual({ userId: 'user123', sessionId: 'session456' });
    });

    it('should return null for invalid JSON', () => {
      const result = parseSessionCookie('invalid json');
      expect(result).toBeNull();
    });

    it('should return null for valid JSON with missing userId', () => {
      const cookieValue = JSON.stringify({ sessionId: 'session456' });
      const result = parseSessionCookie(cookieValue);

      expect(result).toBeNull();
    });

    it('should return null for valid JSON with missing sessionId', () => {
      const cookieValue = JSON.stringify({ userId: 'user123' });
      const result = parseSessionCookie(cookieValue);

      expect(result).toBeNull();
    });

    it('should return null for valid JSON with non-string userId', () => {
      const cookieValue = JSON.stringify({ userId: 123, sessionId: 'session456' });
      const result = parseSessionCookie(cookieValue);

      expect(result).toBeNull();
    });

    it('should return null for valid JSON with non-string sessionId', () => {
      const cookieValue = JSON.stringify({ userId: 'user123', sessionId: 456 });
      const result = parseSessionCookie(cookieValue);

      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseSessionCookie('');
      expect(result).toBeNull();
    });

    it('should return null for JSON null', () => {
      const result = parseSessionCookie('null');
      expect(result).toBeNull();
    });

    it('should return null for JSON array', () => {
      const result = parseSessionCookie('[1,2,3]');
      expect(result).toBeNull();
    });

    it('should return null for empty userId in valid JSON', () => {
      const cookieValue = JSON.stringify({ userId: '', sessionId: 'session456' });
      const result = parseSessionCookie(cookieValue);

      expect(result).toBeNull();
    });

    it('should return null for empty sessionId in valid JSON', () => {
      const cookieValue = JSON.stringify({ userId: 'user123', sessionId: '' });
      const result = parseSessionCookie(cookieValue);

      expect(result).toBeNull();
    });

    it('should handle valid JSON with extra properties', () => {
      const cookieValue = JSON.stringify({
        userId: 'user123',
        sessionId: 'session456',
        extra: 'data',
      });
      const result = parseSessionCookie(cookieValue);

      expect(result).toEqual({
        userId: 'user123',
        sessionId: 'session456',
        extra: 'data',
      });
    });

    it('should handle malformed JSON gracefully', () => {
      const malformedInputs = [
        '{userId: "user123"}', // Missing quotes
        '{"userId": "user123"', // Missing closing brace
        'undefined',
        'NaN',
        '{',
        '}',
      ];

      malformedInputs.forEach(input => {
        expect(parseSessionCookie(input)).toBeNull();
      });
    });
  });
});
