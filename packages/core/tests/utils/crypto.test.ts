import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
  generateSessionId,
  isValidEmail,
  normalizeEmail,
  checkPasswordStrength,
} from '../../src/utils/crypto';

describe('crypto utils', () => {
  describe('hashPassword', () => {
    it('should hash a password and return hash and salt', async () => {
      const password = 'TestPassword123!';
      const result = await hashPassword(password);

      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('salt');
      expect(typeof result.hash).toBe('string');
      expect(typeof result.salt).toBe('string');
      expect(result.hash.length).toBeGreaterThan(0);
      expect(result.salt.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const result1 = await hashPassword(password);
      const result2 = await hashPassword(password);

      expect(result1.hash).not.toBe(result2.hash);
      expect(result1.salt).not.toBe(result2.salt);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const { hash, salt } = await hashPassword(password);
      const isValid = await verifyPassword(password, hash, salt);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const { hash, salt } = await hashPassword(password);
      const isValid = await verifyPassword('WrongPassword123!', hash, salt);

      expect(isValid).toBe(false);
    });

    it('should handle invalid salt gracefully', async () => {
      const isValid = await verifyPassword('password', 'hash', 'invalid-salt');
      expect(isValid).toBe(false);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate a token', () => {
      const token = generateSecureToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with only base32 characters', () => {
      const token = generateSecureToken();
      expect(token).toMatch(/^[a-z2-7]+$/);
    });
  });

  describe('hashToken', () => {
    it('should hash a token', () => {
      const token = 'test-token-123';
      const hashed = hashToken(token);

      expect(typeof hashed).toBe('string');
      expect(hashed.length).toBe(64); // SHA-256 hex length
    });

    it('should generate consistent hashes for same token', () => {
      const token = 'test-token-123';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different tokens', () => {
      const hash1 = hashToken('token1');
      const hash2 = hashToken('token2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateSessionId', () => {
    it('should generate a session ID', () => {
      const sessionId = generateSessionId();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBe(64); // 32 bytes as hex
    });

    it('should generate unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      expect(id1).not.toBe(id2);
    });

    it('should generate hex-only session IDs', () => {
      const sessionId = generateSessionId();
      expect(sessionId).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('invalid@example')).toBe(false);
      expect(isValidEmail('invalid @example.com')).toBe(false);
    });

    it('should reject emails over 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@test.com';
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe('normalizeEmail', () => {
    it('should convert email to lowercase', () => {
      expect(normalizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
      expect(normalizeEmail('Test@Example.Com')).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      expect(normalizeEmail('  test@example.com  ')).toBe('test@example.com');
      expect(normalizeEmail('\ttest@example.com\n')).toBe('test@example.com');
    });

    it('should handle both operations together', () => {
      expect(normalizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
    });
  });

  describe('checkPasswordStrength', () => {
    it('should accept strong passwords', () => {
      const result = checkPasswordStrength('StrongPass123!');
      expect(result.isStrong).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should reject password without lowercase', () => {
      const result = checkPasswordStrength('PASSWORD123!');
      expect(result.isStrong).toBe(false);
      expect(result.issues).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without uppercase', () => {
      const result = checkPasswordStrength('password123!');
      expect(result.isStrong).toBe(false);
      expect(result.issues).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without number', () => {
      const result = checkPasswordStrength('PasswordABC!');
      expect(result.isStrong).toBe(false);
      expect(result.issues).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = checkPasswordStrength('Password123');
      expect(result.isStrong).toBe(false);
      expect(result.issues).toContain('Password must contain at least one special character');
    });

    it('should reject password too short', () => {
      const result = checkPasswordStrength('Pas1!');
      expect(result.isStrong).toBe(false);
      expect(result.issues).toContain('Password must be at least 8 characters long');
    });

    it('should reject password too long', () => {
      const result = checkPasswordStrength('A1!' + 'a'.repeat(254));
      expect(result.isStrong).toBe(false);
      expect(result.issues).toContain('Password must be less than 256 characters');
    });

    it('should report multiple issues', () => {
      const result = checkPasswordStrength('weak');
      expect(result.isStrong).toBe(false);
      expect(result.issues.length).toBeGreaterThan(1);
    });
  });
});
