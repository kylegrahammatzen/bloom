import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validateEmailAndPassword, normalizeEmail } from '../../src/api/validation';

describe('validation', () => {
  describe('validateEmail', () => {
    it('should return null for valid email', () => {
      const result = validateEmail('test@example.com');
      expect(result).toBeNull();
    });

    it('should return error for invalid email', () => {
      const result = validateEmail('invalid-email');
      expect(result).not.toBeNull();
      expect(result?.status).toBe(400);
      expect(result?.body.error.code).toBe('INVALID_EMAIL');
    });

    it('should return error for empty email', () => {
      const result = validateEmail('');
      expect(result).not.toBeNull();
      expect(result?.status).toBe(400);
    });
  });

  describe('validatePassword', () => {
    it('should return null for strong password', () => {
      const result = validatePassword('StrongPass123!');
      expect(result).toBeNull();
    });

    it('should return error for weak password', () => {
      const result = validatePassword('weakpassword');
      expect(result).not.toBeNull();
      expect(result?.status).toBe(400);
      expect(result?.body.error.code).toBe('WEAK_PASSWORD');
    });

    it('should return error for empty password', () => {
      const result = validatePassword('');
      expect(result).not.toBeNull();
      expect(result?.status).toBe(400);
    });

    it('should return error for password too short', () => {
      const result = validatePassword('Short1!');
      expect(result).not.toBeNull();
      expect(result?.status).toBe(400);
    });

    it('should return error for password too long', () => {
      const longPassword = 'A1!' + 'a'.repeat(254);
      const result = validatePassword(longPassword);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(400);
    });
  });

  describe('validateEmailAndPassword', () => {
    it('should return null for valid email and password', () => {
      const result = validateEmailAndPassword('test@example.com', 'StrongPass123!');
      expect(result).toBeNull();
    });

    it('should return email error if email is invalid', () => {
      const result = validateEmailAndPassword('invalid', 'StrongPass123!');
      expect(result).not.toBeNull();
      expect(result?.body.error.code).toBe('INVALID_EMAIL');
    });

    it('should return password error if password is invalid', () => {
      const result = validateEmailAndPassword('test@example.com', 'weakpassword');
      expect(result).not.toBeNull();
      expect(result?.body.error.code).toBe('WEAK_PASSWORD');
    });

    it('should prioritize email error over password error', () => {
      const result = validateEmailAndPassword('invalid', 'weakpassword');
      expect(result).not.toBeNull();
      expect(result?.body.error.code).toBe('INVALID_EMAIL');
    });
  });

  describe('normalizeEmail', () => {
    it('should normalize email', () => {
      expect(normalizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
    });
  });
});
